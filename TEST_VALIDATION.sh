#!/bin/bash
# Script para testear las validaciones de cédula

echo "🧪 TEST: Validación de Documentos - Casos Críticos"
echo "=================================================="
echo ""

# CASO 1: CI no coincide (DEBE RECHAZAR)
echo "❌ CASO 1: Dos cédulas DIFERENTES"
echo "Frente: CI 1792380 | Fecha: 04/03/1996"
echo "Reverso: CI 4708903 | Fecha: 04/03/1996"
echo "ESPERADO: RECHAZAR"
echo "MOTIVO: Los números de cédula no coinciden"
echo ""

# CASO 2: Fecha no coincide (DEBE RECHAZAR)
echo "❌ CASO 2: Misma cédula, DIFERENTES fechas"
echo "Frente: CI 1792380 | Fecha: 04/03/1996"
echo "Reverso: CI 1792380 | Fecha: 04/03/1995"
echo "ESPERADO: RECHAZAR"
echo "MOTIVO: Las fechas de nacimiento no coinciden"
echo ""

# CASO 3: Todo coincide (DEBE ACEPTAR)
echo "✅ CASO 3: Mismo carnet, datos consistentes"
echo "Frente: CI 1792380 | Fecha: 04/03/1996 | Apellido: GONZALEZ | Nombre: GRACIELA"
echo "Reverso: CI 1792380 | Fecha: 04/03/1996 | Apellido: GONZALEZ"
echo "ESPERADO: ACEPTAR"
echo "MOTIVO: CI + Fecha + Apellido coinciden"
echo ""

echo "🔍 PASOS PARA TESTEAR:"
echo "1. Revisa los logs del servidor (busca CÉDULAS DIFERENTES o DOCUMENTO COMPLETAMENTE VÁLIDO)"
echo "2. Si ves 'CÉDULAS DIFERENTES' → ✅ El fix funciona correctamente"
echo "3. Si sigue diciendo 'VÁLIDO' con diferentes CIs → ❌ El fix no se aplicó"
