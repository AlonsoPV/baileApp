# 💳 Tarjetas de Prueba para Stripe (Test Mode)

## ⚠️ IMPORTANTE

Estas tarjetas **SOLO funcionan en modo TEST** de Stripe. Para usarlas:
1. Asegúrate de estar en **Test mode** en tu Stripe Dashboard (toggle en la parte superior)
2. Usa tu clave secreta que empieza con `sk_test_`
3. Los pagos **NO se procesan realmente**, solo simulan el flujo

---

## ✅ Tarjetas que SIEMPRE Funcionan (Éxito)

### Tarjeta Básica - Pago Exitoso
```
Número: 4242 4242 4242 4242
CVV: Cualquier 3 dígitos (ej: 123)
Fecha de vencimiento: Cualquier fecha FUTURA (ej: 12/25)
Código postal: Cualquier código válido (ej: 12345)
```

### Visa - Pago Exitoso
```
Número: 4242 4242 4242 4242
CVV: Cualquier 3 dígitos
Fecha: Cualquier fecha futura
```

### Mastercard - Pago Exitoso
```
Número: 5555 5555 5555 4444
CVV: Cualquier 3 dígitos
Fecha: Cualquier fecha futura
```

### American Express - Pago Exitoso
```
Número: 3782 822463 10005
CVV: Cualquier 4 dígitos (ej: 1234)
Fecha: Cualquier fecha futura
```

---

## ❌ Tarjetas para Probar Errores

### Tarjeta Rechazada por Fondo Insuficiente
```
Número: 4000 0000 0000 9995
CVV: Cualquier 3 dígitos
Fecha: Cualquier fecha futura
Resultado: Error "Your card has insufficient funds."
```

### Tarjeta Rechazada por Fraude
```
Número: 4100 0000 0000 0019
CVV: Cualquier 3 dígitos
Fecha: Cualquier fecha futura
Resultado: Error "Your card was declined."
```

### Tarjeta Expirada
```
Número: 4000 0000 0000 0069
CVV: Cualquier 3 dígitos
Fecha: Cualquier fecha PASADA
Resultado: Error "Your card has expired."
```

### CVV Incorrecto
```
Número: 4000 0000 0000 0127
CVV: Cualquier CVV INCORRECTO (usa uno diferente al correcto)
Fecha: Cualquier fecha futura
Resultado: Error "Your card's security code is incorrect."
```

### Procesamiento (3D Secure)
```
Número: 4000 0025 0000 3155
CVV: Cualquier 3 dígitos
Fecha: Cualquier fecha futura
Resultado: Requiere autenticación 3D Secure (autenticación de tarjeta)
```

---

## 🔄 Tarjetas para Probar Flujos Especiales

### Autorización Requerida (Requiere autenticación del banco)
```
Número: 4000 0025 0000 3155
CVV: Cualquier 3 dígitos
Fecha: Cualquier fecha futura
Resultado: Requiere confirmación del banco
```

### Tarjeta que Siempre Requiere Autenticación
```
Número: 4000 0027 6000 3184
CVV: Cualquier 3 dígitos
Fecha: Cualquier fecha futura
Resultado: Siempre requiere 3D Secure
```

---

## 📧 Email de Prueba

Para el email del checkout, puedes usar cualquier email válido:
- `test@example.com`
- `usuario@test.com`
- O cualquier otro formato válido

**No importa el email, Stripe no enviará correos reales en test mode.**

---

## 🧪 Cómo Probar

1. **Asegúrate de estar en Test Mode:**
   - Stripe Dashboard → Toggle "Test mode" (arriba a la derecha) debe estar activo

2. **Usa cualquier tarjeta de arriba:**
   - Todas funcionan en cualquier checkout de prueba
   - No importa el nombre, dirección, etc.

3. **Verifica los resultados:**
   - Pagos exitosos → Verás confirmación
   - Pagos rechazados → Verás el mensaje de error correspondiente

---

## 📝 Notas Importantes

- ✅ **No se cobra dinero real** - Es solo simulación
- ✅ **Cualquier fecha futura funciona** - No importa el mes/año
- ✅ **Cualquier CVV funciona** - Solo necesita el formato correcto (3-4 dígitos)
- ✅ **Cualquier código postal funciona** - Solo necesita formato válido
- ⚠️ **Solo funciona en Test mode** - No intentes usar estas tarjetas en producción

---

## 🔗 Referencias

- [Documentación oficial de Stripe: Testing Cards](https://stripe.com/docs/testing)
- [Lista completa de tarjetas de prueba](https://stripe.com/docs/testing#cards)

---

## 💡 Tip

**La tarjeta más fácil de recordar para pruebas exitosas:**
```
4242 4242 4242 4242
Cualquier CVV de 3 dígitos
Cualquier fecha futura
```

¡Esta siempre funciona para pagos exitosos! 🎉

