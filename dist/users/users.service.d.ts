import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersService {
    private prisma;
    private authService;
    constructor(prisma: PrismaService, authService: AuthService);
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
