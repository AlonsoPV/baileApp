# Corrección del icono en Android: zona segura (safe zone)

## Problema

En Android, el icono adaptativo puede "desbordarse" o recortarse porque los launchers aplican máscaras con distintas formas (círculo, cuadrado redondeado, squircle). Solo el **66% central** del icono está garantizado como zona visible.

## Solución

El archivo `assets/adaptive-icon.png` debe tener el logo **reducido y centrado** dentro de esa zona:

- Canvas: 1024×1024 px
- Zona segura: círculo de ~672 px de diámetro en el centro (≈66% de 1024)
- El logo debe caber dentro de ese círculo
- Margen aproximado: ~176 px por lado (1024 − 672) / 2

## Pasos para corregir

1. Abre `assets/adaptive-icon.png` en un editor (Figma, Photoshop, GIMP, etc.).
2. Reduce el logo para que ocupe solo el centro (~66% del lienzo).
3. Mantén la zona externa transparente o de color de fondo.
4. Exporta como PNG 1024×1024.
5. Sobrescribe `assets/adaptive-icon.png`.
6. Genera un nuevo build: `pnpm build:prod:android`.

## Plantilla Figma

Puedes usar la [plantilla oficial de Figma para iconos adaptativos](https://www.figma.com/community/file/1466490409418563617) que incluye la zona segura.

## Referencias

- [Android Adaptive Icon Guidelines](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive)
- [Expo - Splash screen and app icon](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/)
