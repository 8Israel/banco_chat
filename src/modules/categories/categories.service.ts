import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { CategoryNotFoundError } from '../../common/errors/app-errors.js';

@Injectable()
export class CategoriesService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll() {
        return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
    }

    async findById(id: number) {
        const category = await this.prisma.category.findUnique({ where: { id } });
        if (!category) {
            throw new CategoryNotFoundError();
        }
        return category;
    }
}
