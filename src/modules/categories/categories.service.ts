import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateCategoryDto } from "./dto/create-category.dto.js";
import { UpdateCategoryDto } from "./dto/update-category.dto.js";
import { PrismaService } from "../../infrastructure/prisma/prisma.service.js";

@Injectable()
export class CategoriesService {

  constructor(private readonly prisma: PrismaService) {}
  
  findAll() {
    return this.prisma.category.findMany();
  }

  findOne(id: number) {
    const category = this.prisma.category.findUnique({
      where: {
        id: id
      }
    });
    if (!category) {
      throw new NotFoundException(`Categoría no existente`);
    }
    return category;
  }
}
