import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { CategoriesService } from "./categories.service.js";
import { CreateCategoryDto } from "./dto/create-category.dto.js";
import { UpdateCategoryDto } from "./dto/update-category.dto.js";
import { Public } from "../../core/decorators/public.decorator.js";
import { ResponseMessage } from "../../core/decorators/response-message.decorator.js";

@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage("Categorías encontradas")
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage("Categoría encontrada")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.categoriesService.findOne(+id);
  }
}
