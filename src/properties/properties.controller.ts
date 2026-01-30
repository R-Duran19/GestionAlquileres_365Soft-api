import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { UpdatePropertyDetailsDto } from './dto/update-property-details.dto';
import { FilterPropertiesDto } from './dto/filter-properties.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { multerConfig } from '../common/utils/multer.config';

// Admin Controller - Gestión completa de propiedades
@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminPropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  // CRUD Properties
  @Post('properties')
  async create(@Body() createPropertyDto: CreatePropertyDto) {
    return this.propertiesService.create(createPropertyDto);
  }

  @Get('properties')
  async findAll(@Query() filters: FilterPropertiesDto) {
    return this.propertiesService.findAll(filters);
  }

  @Get('properties/:id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.propertiesService.findOne(id);
  }

  @Patch('properties/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePropertyDto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(id, updatePropertyDto);
  }

  @Delete('properties/:id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.propertiesService.remove(id);
  }

  // Property Details (edición posterior)
  @Patch('properties/:id/details')
  async updateDetails(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDetailsDto: UpdatePropertyDetailsDto,
  ) {
    return this.propertiesService.updateDetails(id, updateDetailsDto);
  }

  // Upload Images
  @Post('properties/:id/images')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Get current property
    const property = await this.propertiesService.findOne(id);

    // Add new image URL to images array
    const images = property.images || [];
    const imageUrl = `/storage/properties/${file.filename}`;
    images.push(imageUrl);

    // Update property
    return this.propertiesService.updateDetails(id, { images });
  }

  @Delete('properties/:id/images')
  async removeImage(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { image_url: string },
  ) {
    const property = await this.propertiesService.findOne(id);
    const images = property.images || [];

    const index = images.indexOf(body.image_url);
    if (index > -1) {
      images.splice(index, 1);
    }

    return this.propertiesService.updateDetails(id, { images });
  }

  // Property Types and Subtypes
  @Get('property-types')
  async getPropertyTypes() {
    return this.propertiesService.getPropertyTypes();
  }

  @Get('property-subtypes')
  async getPropertySubtypes(@Query('typeId') typeId?: number) {
    return this.propertiesService.getPropertySubtypes(
      typeId ? +typeId : undefined,
    );
  }

  // Rental Owners
  @Post('rental-owners')
  async createRentalOwner(@Body() ownerDto: any) {
    return this.propertiesService.createRentalOwner(ownerDto);
  }

  @Get('rental-owners')
  async getRentalOwners() {
    return this.propertiesService.getRentalOwners();
  }

  @Get('rental-owners/:id')
  async getRentalOwner(@Param('id', ParseIntPipe) id: number) {
    return this.propertiesService.getRentalOwner(id);
  }
}

// Catálogo Público - Propiedades disponibles para todos
@Controller('catalog/:slug')
export class PublicPropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get('properties')
  async findAvailable(
    @Param('slug') slug: string,
    @Query() filters: FilterPropertiesDto,
  ) {
    return this.propertiesService.findAvailable(filters, slug);
  }

  @Get('properties/:id')
  async findOne(
    @Param('slug') slug: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.propertiesService.findOne(id, slug);
  }
}

// Tenant Controller - Gestión de propiedades para inquilinos
@Controller('tenant')
@UseGuards(JwtAuthGuard)
export class TenantPropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get('properties')
  async findAll(@Query() filters: FilterPropertiesDto) {
    return this.propertiesService.findAll(filters);
  }

  @Get('properties/:id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.propertiesService.findOne(id);
  }
}
