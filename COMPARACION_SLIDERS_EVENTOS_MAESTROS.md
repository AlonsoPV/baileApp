# Comparación de Sliders: Eventos vs Maestros

Este documento muestra el código de ambos sliders para facilitar la evaluación de diferencias.

---

## 📅 Slider de Eventos (Fechas)

**Ubicación**: Líneas 2507-2551 de `ExploreHomeScreenModern.tsx`

```tsx
{(showAll || selectedType === 'fechas') && (fechasLoading || hasFechas) && (
  <Section title={t('section_upcoming_scene')} toAll="/explore/list?type=fechas" count={filteredFechas.length} sectionId="fechas">
    {fechasLoading ? (
      <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">{t('loading')}</div>)}</div>
    ) : (
      <>
        {filteredFechas.length > 0 ? (
          <HorizontalSlider
            {...sliderProps}
            items={filteredFechas}
            renderItem={(fechaEvento: any, idx: number) => (
              <div
                key={fechaEvento._recurrence_index !== undefined
                  ? `${fechaEvento._original_id || fechaEvento.id}_${fechaEvento._recurrence_index}`
                  : (fechaEvento.id ?? `fecha_${idx}`)}
                onClickCapture={handlePreNavigate}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 16,
                  padding: 0,
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                }}
              >
                <EventCard item={fechaEvento} />
              </div>
            )}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>{t('no_results')}</div>
        )}
        {fechasLoadMore.hasNextPage && (
          <button
            className="load-more-btn"
            onClick={fechasLoadMore.handleLoadMore}
            disabled={fechasLoadMore.isFetching}
          >
            {fechasLoadMore.isFetching ? t('loading_dots') : t('load_more_dates')}
          </button>
        )}
      </>
    )}
  </Section>
)}
```

### Características del Slider de Eventos:
- ✅ **Items**: `filteredFechas` (array directo)
- ✅ **Key**: Maneja `_recurrence_index` para eventos recurrentes
- ✅ **Card**: `EventCard`
- ✅ **Sin CTAs**: No incluye cards de "Únete"
- ✅ **Validación**: Verifica `filteredFechas.length > 0` antes de renderizar
- ✅ **Load More**: Usa `fechasLoadMore`

---

## 👨‍🏫 Slider de Maestros

**Ubicación**: Líneas 2616-2673 de `ExploreHomeScreenModern.tsx`

```tsx
{(showAll || selectedType === 'maestros') && (maestrosLoading || hasMaestros) && (
  <Section title={t('section_featured_teachers')} toAll="/explore/list?type=teacher" count={maestrosData.length} sectionId="maestros">
    {maestrosLoading ? (
      <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">{t('loading')}</div>)}</div>
    ) : (
      <>
        <HorizontalSlider
          {...sliderProps}
          items={maestrosDataWithCTA}
          renderItem={(item: any, idx: number) => {
            if (item?.__isCTA) {
              return (
                <div
                  key="cta-maestros"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 16,
                    padding: 0,
                    overflow: 'hidden',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <CTACard text={t('cta_teachers')} sectionType="maestros" idx={idx} />
                </div>
              );
            }
            return (
              <div
                key={item.id ?? idx}
                onClickCapture={handlePreNavigate}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 16,
                  padding: 0,
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                }}
              >
                <TeacherCard item={item} />
              </div>
            );
          }}
        />
        {maestrosLoadMore.hasNextPage && (
          <button
            className="load-more-btn"
            onClick={maestrosLoadMore.handleLoadMore}
            disabled={maestrosLoadMore.isFetching}
          >
            {maestrosLoadMore.isFetching ? t('loading_dots') : t('load_more_teachers')}
          </button>
        )}
      </>
    )}
  </Section>
)}
```

### Características del Slider de Maestros:
- ✅ **Items**: `maestrosDataWithCTA` (array con CTAs insertadas)
- ✅ **Key**: Simple `item.id ?? idx`
- ✅ **Card**: `TeacherCard`
- ✅ **Con CTAs**: Incluye `CTACard` cuando `item.__isCTA === true`
- ✅ **Sin validación**: No verifica `length > 0` antes de renderizar
- ✅ **Load More**: Usa `maestrosLoadMore`

---

## 🔍 Diferencias Principales

| Aspecto | Eventos | Maestros |
|---------|---------|----------|
| **Items** | `filteredFechas` | `maestrosDataWithCTA` |
| **Key** | Maneja recurrencia (`_recurrence_index`) | Simple (`item.id ?? idx`) |
| **Card Component** | `EventCard` | `TeacherCard` |
| **CTAs** | ❌ No incluye | ✅ Incluye `CTACard` |
| **Validación length** | ✅ Verifica `> 0` | ❌ No verifica |
| **Mensaje "no results"** | ✅ Muestra mensaje | ❌ No muestra |
| **renderItem** | Inline function | Inline function con lógica CTA |

---

## 📝 Notas Adicionales

### `sliderProps` (común a ambos):
```tsx
const sliderProps = React.useMemo(
  () => ({
    className: isMobile ? 'explore-slider explore-slider--mobile' : 'explore-slider',
    autoColumns: undefined
  }),
  [isMobile]
);
```

### `maestrosDataWithCTA`:
- Se crea usando `createArrayWithCTA(maestrosData, maestrosCTIndex, 'maestros')`
- Inserta un objeto `{ __isCTA: true, sectionType: 'maestros' }` en un índice aleatorio estable

### `filteredFechas`:
- Array directo sin CTAs
- Ya filtrado y ordenado por fecha

---

**Última actualización**: Enero 2025  
**Archivo fuente**: `apps/web/src/screens/explore/ExploreHomeScreenModern.tsx`
