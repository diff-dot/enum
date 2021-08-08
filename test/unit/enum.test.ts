import { expect } from 'chai';
import { classToPlain, Expose, plainToClass, Transform } from 'class-transformer';
import { Enum } from '../../src/Enum';

export class SampleEnum extends Enum {
  static readonly POPULAR = new SampleEnum(1, 'popular');
  static readonly SUBSCRIBER = new SampleEnum(2, 'subscriber');
}

export class SampleVo {
  @Expose()
  @Transform(SampleEnum.Transformer)
  type: SampleEnum;

  @Expose()
  @Transform(SampleEnum.Transformer)
  types: SampleEnum[];
}

describe('enum', async () => {
  it('전체 항목 조회', async () => {
    const values = SampleEnum.values();
    expect(values.length).to.be.eq(2);
  });

  it('ID를 를 Enum 으로 변경', async () => {
    const popular = SampleEnum.valueOf(1);
    expect(popular).to.be.eq(SampleEnum.POPULAR);
  });

  it('tag 를 Enum 으로 변경', async () => {
    const subscriber = SampleEnum.valueOfTag('subscriber');
    expect(subscriber).to.be.eq(SampleEnum.SUBSCRIBER);
  });

  it('enum 이 포함된 vo 의 transform', async () => {
    const vo = new SampleVo();
    vo.type = SampleEnum.SUBSCRIBER;

    // plain object 로 변환
    const plain = classToPlain(vo) as { type: number };
    expect(plain.type).to.be.eq(2);

    // plain object 를 vo 로 변환
    const deVo = plainToClass(SampleVo, plain);
    expect(deVo.type).to.be.eq(SampleEnum.SUBSCRIBER);
  });

  it('잘못된 enum 이 지정된 vo 의 transform시 undefined 르 값을 저장하고 경고 메시지 출력', async () => {
    const vo = new SampleVo();

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    vo.type = 'broken';

    // plain object 로 변환
    const plain = classToPlain(vo) as { type: number };
    expect(plain.type).to.be.undefined;
  });

  it('enum 배열이 포함된 vo 의 transform', async () => {
    const vo = new SampleVo();
    vo.types = [SampleEnum.POPULAR, SampleEnum.SUBSCRIBER];

    // plain object 로 변환
    const plain = classToPlain(vo) as { types: number[] };
    expect(plain.types).to.be.eql([1, 2]);

    // plain object 를 vo 로 변환
    const deVo = plainToClass(SampleVo, plain);
    expect(deVo.types).to.be.eql([SampleEnum.POPULAR, SampleEnum.SUBSCRIBER]);
  });
});
