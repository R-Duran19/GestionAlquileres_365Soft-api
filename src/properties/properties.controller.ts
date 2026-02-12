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
  UploadedFiles,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { CreatePropertyWithImagesDto } from './dto/create-property-with-images.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { UpdatePropertyDetailsDto } from './dto/update-property-details.dto';
import { FilterPropertiesDto } from './dto/filter-properties.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { multerConfig } from '../common/utils/multer.config';

// Admin Controller - Gestión completa de propiedades
@ApiTags('Properties - Admin')
@ApiBearerAuth()
@Controller(':slug/admin')
@UseGuards(JwtAuthGuard)
export class AdminPropertiesController {
  constructor(private readonly propertiesService: PropertiesService) { }

  // CRUD Properties
  @Post('properties')
  @ApiOperation({ summary: 'Crear una nueva propiedad' })
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  async create(@Param('slug') slug: string, @Body() createPropertyDto: CreatePropertyDto) {
    return this.propertiesService.create(createPropertyDto);
  }

  @Post('properties/with-images')
  @ApiOperation({
    summary: 'Crear una nueva propiedad con imágenes',
    description: `
      Endpoint para crear una propiedad y subir imágenes en una sola petición.
      
      **Cómo usar:**
      - Content-Type: multipart/form-data
      - Campos básicos: title, property_type_id, property_subtype_id, description (opcional)
      - addresses: JSON string con array de direcciones. Ejemplo: '[{"address_type":"address_1","street_address":"Calle 123","city":"La Paz","country":"Bolivia"}]'
      - existing_owners (opcional): JSON string con array de IDs de propietarios existentes
      - new_owners (opcional): JSON string con array de nuevos propietarios
      - amenities (opcional): JSON string con array de amenidades. Ejemplo: '["wifi","parking","pool"]'
      - included_items (opcional): JSON string con array de items incluidos
      - images: Uno o más archivos de imagen (máximo 10)
      
      **Ejemplo con curl:**
      \`\`\`bash
      curl -X POST "http://localhost:3000/mi-inmobiliaria/admin/properties/with-images" \\
        -H "Authorization: Bearer YOUR_TOKEN" \\
        -F "title=Departamento Moderno" \\
        -F "property_type_id=1" \\
        -F "property_subtype_id=3" \\
        -F "description=Hermoso departamento en zona céntrica" \\
        -F 'addresses=[{"address_type":"address_1","street_address":"Av. Arce 123","city":"La Paz","country":"Bolivia"}]' \\
        -F 'amenities=["wifi","parking","gym"]' \\
        -F "security_deposit_amount=1000" \\
        -F "images=@/path/to/image1.jpg" \\
        -F "images=@/path/to/image2.jpg"
      \`\`\`
    `
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Departamento Moderno' },
        property_type_id: { type: 'integer', example: 1 },
        property_subtype_id: { type: 'integer', example: 3 },
        description: { type: 'string', example: 'Hermoso departamento en zona céntrica' },
        addresses: {
          type: 'string',
          example: '[{"address_type":"address_1","street_address":"Av. Arce 123","city":"La Paz","country":"Bolivia"}]',
          description: 'JSON string con array de direcciones'
        },
        existing_owners: {
          type: 'string',
          example: '[{"rental_owner_id":1,"ownership_percentage":100,"is_primary":true}]',
          description: 'JSON string con array de propietarios existentes (opcional)'
        },
        new_owners: {
          type: 'string',
          example: '[{"name":"Juan Pérez","primary_email":"juan@example.com","phone_number":"123456"}]',
          description: 'JSON string con array de nuevos propietarios (opcional)'
        },
        amenities: {
          type: 'string',
          example: '["wifi","parking","gym"]',
          description: 'JSON string con array de amenidades (opcional)'
        },
        included_items: {
          type: 'string',
          example: '["refrigerador","estufa","lavadora"]',
          description: 'JSON string con array de items incluidos (opcional)'
        },
        security_deposit_amount: { type: 'number', example: 1000 },
        account_number: { type: 'string', example: '1234567890' },
        account_type: { type: 'string', example: 'savings' },
        account_holder_name: { type: 'string', example: 'Juan Pérez' },
        latitude: { type: 'number', example: -16.5000 },
        longitude: { type: 'number', example: -68.1500 },
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Archivos de imagen (máximo 10, formato: JPG, PNG, GIF, WebP)'
        },
      },
      required: ['title', 'property_type_id', 'property_subtype_id', 'addresses'],
    },
  })
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Solo se permiten archivos de imagen (JPEG, PNG, GIF, WebP)'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB por archivo
      },
    })
  )
  async createWithImages(
    @Param('slug') slug: string,
    @Body() createPropertyDto: CreatePropertyWithImagesDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return await this.propertiesService.createWithImages(
      createPropertyDto,
      images,
      slug,
    );
  }

  @Get('properties')
  @ApiOperation({ summary: 'Obtener todas las propiedades' })
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  async findAll(@Param('slug') slug: string, @Query() filters: FilterPropertiesDto) {
    return this.propertiesService.findAll(filters);
  }

  @Get('properties/:id')
  @ApiOperation({ summary: 'Obtener una propiedad por ID' })
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @ApiParam({ name: 'id', type: Number })
  async findOne(@Param('slug') slug: string, @Param('id', ParseIntPipe) id: number) {
    return this.propertiesService.findOne(id);
  }

  @Patch('properties/:id')
  @ApiOperation({ summary: 'Actualizar una propiedad' })
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @ApiParam({ name: 'id', type: Number })
  async update(
    @Param('slug') slug: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePropertyDto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(id, updatePropertyDto);
  }

  @Delete('properties/:id')
  @ApiOperation({ summary: 'Eliminar una propiedad' })
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @ApiParam({ name: 'id', type: Number })
  async remove(@Param('slug') slug: string, @Param('id', ParseIntPipe) id: number) {
    return this.propertiesService.remove(id);
  }

  // Property Details (edición posterior)
  @Patch('properties/:id/details')
  @ApiOperation({ summary: 'Actualizar detalles de una propiedad' })
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @ApiParam({ name: 'id', type: Number })
  async updateDetails(
    @Param('slug') slug: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDetailsDto: UpdatePropertyDetailsDto,
  ) {
    return this.propertiesService.updateDetails(id, updateDetailsDto);
  }

  // Upload Images
  @Post('properties/:id/images')
  @ApiOperation({ summary: 'Subir imagen de propiedad' })
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @ApiParam({ name: 'id', type: Number })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadImage(
    @Param('slug') slug: string,
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
  @ApiOperation({ summary: 'Eliminar imagen de propiedad' })
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @ApiParam({ name: 'id', type: Number })
  async removeImage(
    @Param('slug') slug: string,
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
  @ApiOperation({ summary: 'Obtener tipos de propiedad' })
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  async getPropertyTypes(@Param('slug') slug: string) {
    return this.propertiesService.getPropertyTypes();
  }

  @Get('property-subtypes')
  @ApiOperation({ summary: 'Obtener subtipos de propiedad' })
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @ApiQuery({ name: 'typeId', required: false, type: Number })
  async getPropertySubtypes(@Param('slug') slug: string, @Query('typeId') typeId?: number) {
    return this.propertiesService.getPropertySubtypes(
      typeId ? +typeId : undefined,
    );
  }

  // Rental Owners
  @Post('rental-owners')
  @ApiOperation({ summary: 'Crear propietario' })
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  async createRentalOwner(@Param('slug') slug: string, @Body() ownerDto: any) {
    return this.propertiesService.createRentalOwner(ownerDto);
  }

  @Get('rental-owners')
  @ApiOperation({ summary: 'Obtener todos los propietarios' })
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  async getRentalOwners(@Param('slug') slug: string) {
    return this.propertiesService.getRentalOwners();
  }

  @Get('rental-owners/:id')
  @ApiOperation({ summary: 'Obtener un propietario' })
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @ApiParam({ name: 'id', type: Number })
  async getRentalOwner(@Param('slug') slug: string, @Param('id', ParseIntPipe) id: number) {
    return this.propertiesService.getRentalOwner(id);
  }
}

// Catálogo Público - Propiedades disponibles para todos
@ApiTags('Properties - Public Catalog')
@Controller(':slug/catalog')
export class PublicPropertiesController {
  constructor(private readonly propertiesService: PropertiesService) { }

  @Get('properties')
  @ApiOperation({ summary: 'Obtener propiedades disponibles (público)' })
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  async findAvailable(
    @Param('slug') slug: string,
    @Query() filters: FilterPropertiesDto,
  ) {
    return this.propertiesService.findAvailable(filters, slug);
  }

  @Get('properties/:id')
  @ApiOperation({ summary: 'Obtener detalle de propiedad (público)' })
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @ApiParam({ name: 'id', type: Number })
  async findOne(
    @Param('slug') slug: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.propertiesService.findOne(id, slug);
  }
}

// Tenant Controller - Gestión de propiedades para inquilinos
@ApiTags('Properties - Tenant')
@ApiBearerAuth()
@Controller(':slug/tenant')
@UseGuards(JwtAuthGuard)
export class TenantPropertiesController {
  constructor(private readonly propertiesService: PropertiesService) { }

  @Get('properties')
  @ApiOperation({ summary: 'Obtener propiedades del inquilino' })
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  async findAll(@Param('slug') slug: string, @Query() filters: FilterPropertiesDto) {
    return this.propertiesService.findAll(filters);
  }

  @Get('properties/:id')
  @ApiOperation({ summary: 'Obtener una propiedad del inquilino' })
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @ApiParam({ name: 'id', type: Number })
  async findOne(@Param('slug') slug: string, @Param('id', ParseIntPipe) id: number) {
    return this.propertiesService.findOne(id);
  }
}
