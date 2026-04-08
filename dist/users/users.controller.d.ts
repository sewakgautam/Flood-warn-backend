import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    create(dto: CreateUserDto): Promise<{
        access_token: string;
        token_type: string;
        email: string;
        id: string;
        name: string;
        phone: string;
        role: string;
        createdAt: Date;
    }>;
}
