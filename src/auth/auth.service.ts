import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Prisma, Role, User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && (await bcrypt.compare(password, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: Omit<User, 'password'>) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(email: string, password: string, name: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const isFirstUser = (await this.prisma.user.count()) === 0;
    try {
      const user = await this.prisma.$transaction(
        async (prisma) => {
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email },
            select: { id: true },
          });

          if (existingUser) {
            throw new ConflictException('User with this email already exists');
          }

          // Create user
          return prisma.user.create({
            data: {
              email,
              password: hashedPassword,
              name,
              role: isFirstUser ? Role.ADMIN : Role.USER,
            },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable, // Highest isolation level
        },
      );

      return user;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      // Handle other potential errors (e.g., database connection issues)
      throw new Error('An error occurred during registration');
    }
  }
  async validateOrCreateGoogleUser(googleUser: any): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (user) {
      return user;
    }

    return this.prisma.user.create({
      data: {
        email: googleUser.email,
        name: `${googleUser.firstName} ${googleUser.lastName} `,
        password: '', // Set a placeholder password or generate a random one
      },
    });
  }
}
