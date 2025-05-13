import { Injectable } from '@nestjs/common';
import hadBuyFundDot from './model/had-buy-fund-dot';

@Injectable()
export class AppService {
  async getHello() {
    // const savedUser = await hadBuyFundDot.create(resultList);
    // const list = await hadBuyFundDot.create(result);

    // const newUser = new hadBuyFundDot({
    //   fundCode: '111',
    //   buyDate: '111',
    //   buyPrice: 11,
    // });

    // const savedUser = await newUser.save();
    // const list = await hadBuyFundDot.find();
    // const list = req.headers;
    // console.log('list', list);

    return 'aaa';
  }
}
