import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthDto } from '../user/dto/auth.dto';
import { UserService } from '..//user/user.service';

@Injectable()
export class AuthService {
    constructor(
        private jwt: JwtService,
        private userSerivce: UserService
    ){}

    async login(dto: AuthDto){
        return dto
    }
}
