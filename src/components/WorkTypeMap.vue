<template>
  <div class="relative">
    <div
      id="map"
      ref="map"
      class="absolute top-0 left-0 right-0 bottom-0"
    ></div>
  </div>
</template>
<script>
import * as L from 'leaflet';
import { colors, templates } from '@/icons/icons_templates';

export default {
  name: 'WorkTypeMap',
  props: {
    workTypes: {
      type: Array,
      default: () => {
        return [];
      },
    },
  },
  data() {
    return {
      markers: [],
      templates,
      colors,
      map: null,
    };
  },
  async mounted() {
    await this.loadMap();
  },
  methods: {
    async loadMap() {
      this.mapLoading = true;

      this.markers = this.workTypes;
      await this.renderMap(this.workTypes);

      this.$nextTick(() => {
        // Add this slight pan to re-render map
        this.map.panBy([1, 0]);
      });

      this.mapLoading = false;
    },
    async renderMap(markers) {
      if (!this.map) {
        this.map = L.map('map', {
          zoomControl: false,
        }).setView([35.7465122599185, -96.41150963125656], 10);
      }
      const { map } = this;

      L.tileLayer(
        'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
        {
          attribution:
            '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
          detectRetina: false,
          maxZoom: 18,
          noWrap: false,
        },
      ).addTo(map);

      markers.forEach((wt) => {
        const { coordinates } = wt.location;
        const latLng = L.latLng(coordinates[1], coordinates[0]);

        const colorsKey = `${wt.status}_${
          wt.claimed_by ? 'claimed' : 'unclaimed'
        }`;
        const spriteColors = colors[colorsKey];
        const template = templates[wt.work_type] || templates.unknown;
        const typeSvg = template
          .replace('{{fillColor}}', spriteColors.fillColor)
          .replace('{{strokeColor}}', spriteColors.strokeColor)
          .replace('{{multiple}}', '');

        const iconSettings = {
          mapIconUrl: typeSvg,
          mapIconColor: 'blue',
          mapIconColorInnerCircle: '#fff',
          pinInnerCircleRadius: 48,
        };

        const divIcon = L.divIcon({
          className: 'leaflet-data-marker',
          html: L.Util.template(iconSettings.mapIconUrl, iconSettings),
          iconAnchor: [12, 32],
          iconSize: [30, 30],
          popupAnchor: [0, -28],
        });

        new L.marker(latLng, { icon: divIcon }).addTo(map);
        map.panTo(latLng);
      });

      map.attributionControl.setPosition('bottomright');
    },
  },
};
</script>

<style>
@import '~leaflet/dist/leaflet.css';

.leaflet-data-marker svg {
  width: 30px;
  height: 30px;
}
</style>
