import { TransformationType } from 'class-transformer';
import { EnumIdNotFoundError } from './error/EnumIdNotFoundError';
import { EnumTagNotFoundError } from './error/EnumTagNotFoundError';

export type EnumId = string | number;

export class Enum {
  id: EnumId;
  tag?: string; // 태그를 통한 탐색 등이 필요할 경우 생성자를 별도 정의하여 사용

  // eslint-disable-next-line
  public constructor(id: EnumId, ...args: any) {
    this.id = id;
  }

  private static _idMap: Map<EnumId, Enum>;
  public static get idMap(): Map<EnumId, Enum> {
    if (!this._idMap) {
      this._idMap = new Map<EnumId, Enum>();
      Object.entries(this).forEach(v => {
        if (!(v[1] instanceof Enum)) return;
        const val = v[1] as Enum;
        this._idMap.set(val.id, val);
      });
    }

    return this._idMap;
  }

  public static values<T extends typeof Enum>(this: T): InstanceType<T>[] {
    const values = [...this.idMap.values()] as InstanceType<T>[];
    return values;
  }

  public static valueOf<T extends typeof Enum>(this: T, id: EnumId): InstanceType<T> {
    const value = this.idMap.get(id);
    if (!value) throw new EnumIdNotFoundError(`cannot find value in ${this.name}, id : ${id}`);
    return value as InstanceType<T>;
  }

  public static hasId<T extends typeof Enum>(this: T, id: EnumId): boolean {
    return this.idMap.has(id);
  }

  public static hasTag<T extends typeof Enum>(this: T, tag: string): boolean {
    for (const value of this.values()) {
      if (value.tag === tag) return true;
    }
    return false;
  }

  public static valueOfTag<T extends typeof Enum>(this: T, tag: string): InstanceType<T> {
    for (const value of this.values()) {
      if (value.tag === tag) return value;
    }
    throw new EnumTagNotFoundError(`cannot find value in ${this.name}, tag : ${tag}`);
  }

  public toString(): string {
    return this.id.toString();
  }

  public toJSON(): EnumId {
    return this.id;
  }

  public equal(value: Enum): boolean {
    return this.id === value.id;
  }

  /**
   * class transformer 를 통해 id 를 enum 으로 변환
   * 값 또는 타입이 잘못된 id 가 확인된 경우 에러를 발생시키지 않고 undefined 를 반환하고 에러 로깅
   */
  private static transformIdToEnum(value: unknown): Enum | undefined {
    if (typeof value !== 'number' && typeof value !== 'string') {
      console.error(`${value} is invalid id type of ${this.name}`);
      return undefined;
    }

    if (!this.hasId(value)) {
      console.error(`cannot find id ${value} in ${this.name}`);
      return undefined;
    }

    return this.valueOf(value);
  }

  /**
   * class transformer 를 통해 enum 을 id 로 변환
   * enum 이 아닌 값이 전달된 경우 undefined 를 반환하고 에러 로깅
   */
  private static transformEnumToId(value: unknown): EnumId | undefined {
    if (!(value instanceof Enum)) {
      console.error(`${value} is not enum of ${this.name}`);
      return undefined;
    }

    return value.id;
  }

  public static get Transformer() {
    return ({ value, type }: { value: (Enum | EnumId) | (Enum | EnumId)[]; type: TransformationType }): unknown => {
      // 값이 없는 경우 원형을 그대로 반환
      if (value === undefined || value === null) return value;

      if (type === TransformationType.PLAIN_TO_CLASS) {
        // enum id 를 enum 으로 변환
        if (Array.isArray(value)) {
          const payload: Enum[] = [];
          for (const item of value) {
            const res = this.transformIdToEnum(item);
            if (res) payload.push(res);
          }
          return payload;
        } else {
          return this.transformIdToEnum(value);
        }
      } else if (type === TransformationType.CLASS_TO_PLAIN) {
        // enum 을 id 로 변환
        if (Array.isArray(value)) {
          const payload: EnumId[] = [];
          for (const item of value) {
            const enumId = this.transformEnumToId(item);
            if (enumId) payload.push(enumId);
          }
          return payload;
        } else {
          return this.transformEnumToId(value);
        }
      }
    };
  }
}
