# Ejemplos de Uso - Crear Propiedad con Imágenes

## Ejemplo 1: Caso Simple (mínimo requerido)

### cURL
```bash
curl -X POST "http://localhost:3000/mi-inmobiliaria/admin/properties/with-images" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "title=Casa en Venta" \
  -F "property_type_id=1" \
  -F "property_subtype_id=3" \
  -F 'addresses=[{"address_type":"address_1","street_address":"Calle 123","city":"La Paz","country":"Bolivia"}]' \
  -F "images=@foto1.jpg"
```

### JavaScript
```javascript
const formData = new FormData();
formData.append('title', 'Casa en Venta');
formData.append('property_type_id', '1');
formData.append('property_subtype_id', '3');
formData.append('addresses', JSON.stringify([
  {
    address_type: 'address_1',
    street_address: 'Calle 123',
    city: 'La Paz',
    country: 'Bolivia'
  }
]));
formData.append('images', imageFile);

const response = await fetch('http://localhost:3000/mi-inmobiliaria/admin/properties/with-images', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_JWT_TOKEN' },
  body: formData
});
```

---

## Ejemplo 2: Propiedad Completa con Todas las Opciones

### cURL
```bash
curl -X POST "http://localhost:3000/mi-inmobiliaria/admin/properties/with-images" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "title=Departamento Premium Sopocachi" \
  -F "property_type_id=1" \
  -F "property_subtype_id=1" \
  -F "description=Hermoso departamento de 120m2, 3 dormitorios, 2 baños, terraza con vista panorámica" \
  -F 'addresses=[{"address_type":"address_1","street_address":"Av. 20 de Octubre 2345, Edificio Torres del Sol, Piso 8","city":"La Paz","state":"La Paz","zip_code":"00000","country":"Bolivia"}]' \
  -F 'amenities=["wifi","parking","gym","pool","balcony","elevator","security_24h"]' \
  -F 'included_items=["refrigerador","cocina_empotrada","horno","microondas","lavadora","secadora","aire_acondicionado","calefaccion"]' \
  -F "security_deposit_amount=3000" \
  -F "account_number=1234567890" \
  -F "account_type=ahorros" \
  -F "account_holder_name=Juan Pérez Rodríguez" \
  -F "latitude=-16.5000" \
  -F "longitude=-68.1500" \
  -F "images=@foto_fachada.jpg" \
  -F "images=@foto_sala.jpg" \
  -F "images=@foto_cocina.jpg" \
  -F "images=@foto_dormitorio1.jpg" \
  -F "images=@foto_dormitorio2.jpg" \
  -F "images=@foto_bano.jpg" \
  -F "images=@foto_terraza.jpg"
```

### JavaScript (React/Frontend)
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  const formData = new FormData();
  
  // Información básica
  formData.append('title', 'Departamento Premium Sopocachi');
  formData.append('property_type_id', '1');
  formData.append('property_subtype_id', '1');
  formData.append('description', 
    'Hermoso departamento de 120m2, 3 dormitorios, 2 baños, terraza con vista panorámica'
  );
  
  // Direcciones
  formData.append('addresses', JSON.stringify([
    {
      address_type: 'address_1',
      street_address: 'Av. 20 de Octubre 2345, Edificio Torres del Sol, Piso 8',
      city: 'La Paz',
      state: 'La Paz',
      zip_code: '00000',
      country: 'Bolivia'
    }
  ]));
  
  // Amenidades
  formData.append('amenities', JSON.stringify([
    'wifi',
    'parking',
    'gym',
    'pool',
    'balcony',
    'elevator',
    'security_24h'
  ]));
  
  // Items incluidos
  formData.append('included_items', JSON.stringify([
    'refrigerador',
    'cocina_empotrada',
    'horno',
    'microondas',
    'lavadora',
    'secadora',
    'aire_acondicionado',
    'calefaccion'
  ]));
  
  // Información financiera
  formData.append('security_deposit_amount', '3000');
  formData.append('account_number', '1234567890');
  formData.append('account_type', 'ahorros');
  formData.append('account_holder_name', 'Juan Pérez Rodríguez');
  
  // Geolocalización
  formData.append('latitude', '-16.5000');
  formData.append('longitude', '-68.1500');
  
  // Imágenes (desde input file)
  const imageFiles = document.getElementById('images').files;
  for (let i = 0; i < imageFiles.length; i++) {
    formData.append('images', imageFiles[i]);
  }
  
  try {
    const response = await fetch('http://localhost:3000/mi-inmobiliaria/admin/properties/with-images', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Propiedad creada:', data);
    alert('¡Propiedad creada exitosamente!');
  } catch (error) {
    console.error('Error:', error);
    alert('Error al crear la propiedad');
  }
};
```

---

## Ejemplo 3: Con Propietario Existente

### cURL
```bash
curl -X POST "http://localhost:3000/mi-inmobiliaria/admin/properties/with-images" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "title=Oficina Centro" \
  -F "property_type_id=2" \
  -F "property_subtype_id=5" \
  -F "description=Oficina moderna en edificio corporativo" \
  -F 'addresses=[{"address_type":"address_1","street_address":"Av. Arce 1234","city":"La Paz","country":"Bolivia"}]' \
  -F 'existing_owners=[{"rental_owner_id":5,"ownership_percentage":100,"is_primary":true}]' \
  -F "images=@oficina1.jpg" \
  -F "images=@oficina2.jpg"
```

---

## Ejemplo 4: Crear Nuevo Propietario con la Propiedad

### cURL
```bash
curl -X POST "http://localhost:3000/mi-inmobiliaria/admin/properties/with-images" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "title=Casa Familiar Zona Sur" \
  -F "property_type_id=1" \
  -F "property_subtype_id=3" \
  -F 'addresses=[{"address_type":"address_1","street_address":"Calle Los Pinos 456","city":"La Paz","country":"Bolivia"}]' \
  -F 'new_owners=[{"name":"María González","primary_email":"maria@example.com","phone_number":"71234567","is_company":false}]' \
  -F "images=@casa1.jpg"
```

### JavaScript
```javascript
formData.append('new_owners', JSON.stringify([
  {
    name: 'María González',
    company_name: null,
    is_company: false,
    primary_email: 'maria@example.com',
    phone_number: '71234567',
    secondary_email: 'maria.gonzalez@gmail.com',
    secondary_phone: '22123456',
    notes: 'Propietaria desde 2020'
  }
]));
```

---

## Ejemplo 5: HTML Form Completo

```html
<!DOCTYPE html>
<html>
<head>
  <title>Crear Propiedad</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .form-group { margin-bottom: 15px; }
    label { display: block; margin-bottom: 5px; font-weight: bold; }
    input, textarea, select { width: 100%; padding: 8px; box-sizing: border-box; }
    button { background: #007bff; color: white; padding: 10px 20px; border: none; cursor: pointer; }
    button:hover { background: #0056b3; }
    .images-preview { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
    .images-preview img { max-width: 150px; max-height: 150px; object-fit: cover; }
  </style>
</head>
<body>
  <h1>Crear Nueva Propiedad</h1>
  
  <form id="propertyForm">
    <div class="form-group">
      <label for="title">Título *</label>
      <input type="text" id="title" name="title" required>
    </div>
    
    <div class="form-group">
      <label for="property_type_id">Tipo de Propiedad *</label>
      <select id="property_type_id" name="property_type_id" required>
        <option value="">Seleccione...</option>
        <option value="1">Residencial</option>
        <option value="2">Comercial</option>
      </select>
    </div>
    
    <div class="form-group">
      <label for="property_subtype_id">Subtipo *</label>
      <select id="property_subtype_id" name="property_subtype_id" required>
        <option value="">Seleccione...</option>
        <option value="1">Condominio/Townhouse</option>
        <option value="2">Multifamiliar</option>
        <option value="3">Unifamiliar</option>
      </select>
    </div>
    
    <div class="form-group">
      <label for="description">Descripción</label>
      <textarea id="description" name="description" rows="4"></textarea>
    </div>
    
    <div class="form-group">
      <label for="street_address">Dirección *</label>
      <input type="text" id="street_address" name="street_address" required>
    </div>
    
    <div class="form-group">
      <label for="city">Ciudad *</label>
      <input type="text" id="city" name="city" required>
    </div>
    
    <div class="form-group">
      <label for="country">País *</label>
      <input type="text" id="country" name="country" value="Bolivia" required>
    </div>
    
    <div class="form-group">
      <label for="security_deposit_amount">Depósito de Garantía (BOB)</label>
      <input type="number" id="security_deposit_amount" name="security_deposit_amount" step="0.01">
    </div>
    
    <div class="form-group">
      <label for="amenities">Amenidades (separadas por coma)</label>
      <input type="text" id="amenities" name="amenities" placeholder="wifi, parking, gym">
    </div>
    
    <div class="form-group">
      <label for="included_items">Items Incluidos (separados por coma)</label>
      <input type="text" id="included_items" name="included_items" placeholder="refrigerador, estufa">
    </div>
    
    <div class="form-group">
      <label for="images">Imágenes (máximo 10) *</label>
      <input type="file" id="images" name="images" multiple accept="image/*" required>
      <div id="imagesPreview" class="images-preview"></div>
    </div>
    
    <button type="submit">Crear Propiedad</button>
  </form>
  
  <script>
    // Preview de imágenes
    document.getElementById('images').addEventListener('change', function(e) {
      const preview = document.getElementById('imagesPreview');
      preview.innerHTML = '';
      
      for (let file of e.target.files) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const img = document.createElement('img');
          img.src = e.target.result;
          preview.appendChild(img);
        };
        reader.readAsDataURL(file);
      }
    });
    
    // Submit del formulario
    document.getElementById('propertyForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData();
      
      // Campos básicos
      formData.append('title', document.getElementById('title').value);
      formData.append('property_type_id', document.getElementById('property_type_id').value);
      formData.append('property_subtype_id', document.getElementById('property_subtype_id').value);
      formData.append('description', document.getElementById('description').value);
      
      // Dirección como JSON
      const addresses = [{
        address_type: 'address_1',
        street_address: document.getElementById('street_address').value,
        city: document.getElementById('city').value,
        country: document.getElementById('country').value
      }];
      formData.append('addresses', JSON.stringify(addresses));
      
      // Depósito
      const deposit = document.getElementById('security_deposit_amount').value;
      if (deposit) {
        formData.append('security_deposit_amount', deposit);
      }
      
      // Amenidades
      const amenitiesStr = document.getElementById('amenities').value;
      if (amenitiesStr) {
        const amenities = amenitiesStr.split(',').map(a => a.trim()).filter(a => a);
        formData.append('amenities', JSON.stringify(amenities));
      }
      
      // Items incluidos
      const itemsStr = document.getElementById('included_items').value;
      if (itemsStr) {
        const items = itemsStr.split(',').map(i => i.trim()).filter(i => i);
        formData.append('included_items', JSON.stringify(items));
      }
      
      // Imágenes
      const images = document.getElementById('images').files;
      for (let image of images) {
        formData.append('images', image);
      }
      
      try {
        const token = prompt('Ingrese su token JWT:');
        
        const response = await fetch('http://localhost:3000/mi-inmobiliaria/admin/properties/with-images', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          alert('¡Propiedad creada exitosamente!');
          console.log('Datos de la propiedad:', data);
          this.reset();
          document.getElementById('imagesPreview').innerHTML = '';
        } else {
          const error = await response.json();
          alert('Error: ' + (error.message || 'Error desconocido'));
          console.error('Error:', error);
        }
      } catch (error) {
        alert('Error de conexión: ' + error.message);
        console.error('Error:', error);
      }
    });
  </script>
</body>
</html>
```

---

## Notas Importantes

1. **Reemplaza `YOUR_JWT_TOKEN`** con tu token real
2. **Reemplaza `mi-inmobiliaria`** con tu slug de tenant
3. **Ajusta la URL** según tu entorno (localhost:3000, producción, etc.)
4. Los campos marcados con `*` son obligatorios
5. Las rutas de archivos (`@foto1.jpg`) deben ser rutas válidas en tu sistema
