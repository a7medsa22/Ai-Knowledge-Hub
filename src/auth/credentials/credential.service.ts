import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { UserEntity } from "src/users/entities/user.entity";
import { UsersService } from "src/users/users.service";
import { RegisterDto } from "../dto/auth.dto";
import { CreateUserDto } from "src/users/dto/user.dto";

@Injectable()
export class CredentialService {
    constructor(
        private readonly userService: UsersService,
    ) { }

    async createUser(data: CreateUserDto) {
        const user = await this.userService.create(data)

        if (!user)
            throw new UnprocessableEntityException('Error creating user');
        
        return user
    }
    
    

}