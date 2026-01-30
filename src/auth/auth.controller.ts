import {
  Controller,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Get,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register-admin')
  async registerAdmin(@Body() registerAdminDto: RegisterAdminDto) {
    return this.authService.registerAdmin(registerAdminDto);
  }

  @Public()
  @Post(':slug/login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Param('slug') slug: string,
    @Body() loginDto: LoginDto,
  ) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
      slug,
    );
    return this.authService.login(user, slug);
  }

  @Public()
  @Post(':slug/register')
  async register(
    @Param('slug') slug: string,
    @Body() registerDto: RegisterDto,
  ) {
    return this.authService.register(
      registerDto.name,
      registerDto.email,
      registerDto.password,
      slug,
      registerDto.phone,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req) {
    return req.user;
  }
}
