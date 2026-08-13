import { Body, Controller, Get, HttpStatus, Inject, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response as ExpressResponse } from 'express';
import { PaginationDto, UuidParamDto } from '@common/dtos/index.dtos';
import { InvalidInput, Unauthenticated } from '@common/responses';
import { WalletPattern } from '@contracts/patterns';
import { CreateWalletBodyDto, WalletOperationBodyDto } from './common/wallet.dtos';
import { RateLimitGuard, RedisService, Throttle } from '@cache/index';
import { UserPayload } from '@models';
import { ResponseCode, ResponseMessage, UserRoles } from '@utils/enum';
import { AuthGuard } from '@common/guards/auth.guard';
import { CurrentUser } from '@common/decorator/current-user.decorator';
import { HasRoles } from '@common/decorator/role.decorator';
import { WALLET_SERVICE } from '@gateway/modules/client/client.module';
import { send } from '@gateway/modules/client/service.client';
import { TransactionListResponse, TransactionModel, TransactionResponse, WalletListResponse, WalletModel, WalletResponse } from './wallet.response';

const BALANCE_CACHE_TTL = 10;

@ApiTags('Wallet')
@ApiBearerAuth()
@UseGuards(AuthGuard, RateLimitGuard)
@HasRoles(UserRoles.USER)
@Controller('wallet')
export class WalletController {
  constructor(
    @Inject(WALLET_SERVICE) private readonly walletService: ClientProxy,
    private readonly redis: RedisService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Open a wallet for the authenticated user' })
  @ApiCreatedResponse({ description: ResponseMessage.CREATED_SUCCESSFULLY, type: WalletResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: Unauthenticated })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: InvalidInput })
  async create(@CurrentUser() currentUser: UserPayload, @Body() payload: CreateWalletBodyDto, @Res({ passthrough: true }) res: ExpressResponse) {
    const wallet = await send<WalletModel>(this.walletService, WalletPattern.CREATE, { ...payload, userId: currentUser.id });

    await this.redis.del(`wallets:${currentUser.id}`);
    res.status(HttpStatus.CREATED);
    return new WalletResponse(wallet);
  }

  @Get()
  @ApiOperation({ summary: 'List the authenticated user wallets' })
  @ApiOkResponse({ description: ResponseMessage.SUCCESS, type: WalletListResponse })
  async findMine(@CurrentUser() currentUser: UserPayload, @Res({ passthrough: true }) res: ExpressResponse) {
    // Fast lookup: balances are read far more often than they change.
    const wallets = await this.redis.remember(`wallets:${currentUser.id}`, BALANCE_CACHE_TTL, () =>
      send<WalletModel[]>(this.walletService, WalletPattern.FIND_BY_USER, { userId: currentUser.id }),
    );

    res.status(HttpStatus.OK);
    return new WalletListResponse(wallets);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one wallet' })
  @ApiOkResponse({ description: ResponseMessage.SUCCESS, type: WalletResponse })
  async findById(@Param() params: UuidParamDto, @Res({ passthrough: true }) res: ExpressResponse) {
    const wallet = await send<WalletModel>(this.walletService, WalletPattern.FIND_BY_ID, { id: params.id });

    res.status(HttpStatus.OK);
    return new WalletResponse(wallet);
  }

  @Post(':id/credit')
  @Throttle(30, 60)
  @ApiOperation({ summary: 'Credit a wallet' })
  @ApiCreatedResponse({ description: ResponseMessage.CREATED_SUCCESSFULLY, type: TransactionResponse })
  @ApiResponse({ status: ResponseCode.WALLET_NOT_FOUND, type: InvalidInput })
  async credit(@CurrentUser() currentUser: UserPayload, @Param() params: UuidParamDto, @Body() payload: WalletOperationBodyDto, @Res({ passthrough: true }) res: ExpressResponse) {
    const transaction = await send<TransactionModel>(this.walletService, WalletPattern.CREDIT, { ...payload, walletId: params.id });

    await this.redis.del(`wallets:${currentUser.id}`);
    res.status(HttpStatus.CREATED);
    return new TransactionResponse(transaction);
  }

  @Post(':id/debit')
  @Throttle(30, 60)
  @ApiOperation({ summary: 'Debit a wallet' })
  @ApiCreatedResponse({ description: ResponseMessage.CREATED_SUCCESSFULLY, type: TransactionResponse })
  async debit(@CurrentUser() currentUser: UserPayload, @Param() params: UuidParamDto, @Body() payload: WalletOperationBodyDto, @Res({ passthrough: true }) res: ExpressResponse) {
    const transaction = await send<TransactionModel>(this.walletService, WalletPattern.DEBIT, { ...payload, walletId: params.id });

    await this.redis.del(`wallets:${currentUser.id}`);
    res.status(HttpStatus.CREATED);
    return new TransactionResponse(transaction);
  }

  @Get(':id/transactions')
  @ApiOperation({ summary: 'List a wallet ledger' })
  @ApiOkResponse({ description: ResponseMessage.SUCCESS, type: TransactionListResponse })
  async transactions(@Param() params: UuidParamDto, @Query() query: PaginationDto, @Res({ passthrough: true }) res: ExpressResponse) {
    const result = await send<{ data: TransactionModel[]; meta: any }>(this.walletService, WalletPattern.TRANSACTIONS, {
      walletId: params.id,
      query: { page: query.page, pageSize: query.pageSize, sort: query.sort },
    });

    res.status(HttpStatus.OK);
    return new TransactionListResponse(result.data, result.meta);
  }
}
