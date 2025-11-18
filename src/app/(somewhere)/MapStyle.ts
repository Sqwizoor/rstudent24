// Minimal Mapbox style definition used by your map component.
// Adjust "sources" and "layers" to match your actual data.

export const mapStyle: mapboxgl.Style = {
  version: 8,
  // ...existing style metadata (sprite, glyphs, etc.)...
  sources: {
    // ...your existing sources...
    // example:
    // streets: {
    //   type: 'vector',
    //   url: 'mapbox://mapbox.mapbox-streets-v8',
    // },
  },
  layers: [
    // ...your other layers...

    // Example layer showing how to safely use "len" as a number
    {
      id: 'road-labels-safe-len',
      type: 'symbol',
      source: 'streets', // adjust to your real source id
      'source-layer': 'road', // adjust to your real source-layer
      layout: {
        // ...existing layout props (text-field, font, etc.)...

        // Visibility / filtering expression that used to error on ["get","len"]
        // We coalesce "len" to 0 so it is always a number.
        visibility: [
          'case',
          [
            'all',
            [
              'case',
              ['has', 'reflen'],
              ['<=', ['number', ['get', 'reflen']], 6],
              ['has', 'shield_beta'],
            ],
            [
              'match',
              ['get', 'class'],
              ['pedestrian', 'service'],
              false,
              true,
            ],
            [
              'step',
              ['zoom'],
              ['==', ['geometry-type'], 'Point'],
              11,
              ['>', ['coalesce', ['number', ['get', 'len']], 0], 5000],
              12,
              ['>', ['coalesce', ['number', ['get', 'len']], 0], 2500],
              13,
              ['>', ['coalesce', ['number', ['get', 'len']], 0], 1000],
              14,
              true,
            ],
            [
              'step',
              ['pitch'],
              true,
              50,
              ['<', ['distance-from-center'], 2],
              60,
              ['<', ['distance-from-center'], 2.5],
              70,
              ['<', ['distance-from-center'], 3],
            ],
          ],
          true,
          false,
        ],
      },
      paint: {
        // ...existing paint props...
      },
    },
  ],
};