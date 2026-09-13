import { Controller, Get } from '@nestjs/common';
import { CategoriesService } from './categories.service.js';
import { ResponseMessage } from '../../core/decorators/response-message.decorator.js';

@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Get()
    @ResponseMessage('Categorías obtenidas')
    findAll() {
        return this.categoriesService.findAll();
    }
}
