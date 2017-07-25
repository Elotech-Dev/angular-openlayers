import { Http, Headers } from '@angular/http';
import { Component, OnInit } from '@angular/core';

const ol = require('openlayers');

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  private static GOOGLE_MAPS_URL = 'maps/api/directions/json?key=AIzaSyC1A9BlCRU5r-u4O6VsPmHMjpAVlN4zcOk';

  private static ROUTE_STYLE = new ol.style.Style({
    stroke: new ol.style.Stroke({
      width: 6, color: [40, 40, 40, 0.8]
    })
  });

  private static PLACE_STYLE  = new ol.style.Style({
        image: new ol.style.Icon({
          anchor: [0.5, 1],
          src: '//cdn.rawgit.com/openlayers/ol3/master/examples/data/icon.png'
        })
      });

  title = '';
  msg = '';
  coordinates: any[] = [];
  resp: any = null;
  routes: any = null;


  private map: any;
  private vectorSource: any;


  constructor(private http: Http) { }

  ngOnInit() {
    this.title = 'Angular OpenLayers';
    this.msg = 'Select source...';

    const raster = new ol.layer.Tile({
      source: new ol.source.OSM()
    });

    this.vectorSource = new ol.source.Vector({});

    this.map = new ol.Map({
      target: 'map',
      layers: [raster, new ol.layer.Vector({
        source: this.vectorSource
      })],
      view: new ol.View({
        center: ol.proj.fromLonLat([-51.9375, -23.4273]),
        zoom: 14
      })
    });


    this.map.on('click', evt => {

      if (this.coordinates.length < 2) {

        this.createPlace(evt.coordinate);

        this.coordinates.push(this.coordinateToLatLog(evt.coordinate));

        if (this.coordinates.length > 1) {
          this.msg = 'Calculating route...';

          this.http.get(`${AppComponent.GOOGLE_MAPS_URL}&origin=${this.coordinates[0]}&destination=${this.coordinates[1]}`)
            .subscribe(resp => this.handle(resp));


        } else {
          this.msg = 'Select target...';
        }

      }

    });

  }

  createPlace(coord) {
    const place = new ol.Feature({
      type: 'place',
      geometry: new ol.geom.Point(coord)
    });
    place.setStyle(AppComponent.PLACE_STYLE);

    this.vectorSource.addFeature(place);
  }

  clear() {
    this.msg = 'Select source...';
    this.coordinates = [];
    this.vectorSource.clear();
    this.resp = null;
  }

  private coordinateToLatLog(coordinate) {

    const points = ol.proj.transform(coordinate, 'EPSG:3857', 'EPSG:4326');

    return [points[1], points[0]];

  }

  private handle(response) {
    this.resp = response.json();
    this.routes = null;
    if (this.resp.routes.length > 0) {
      this.routes = this.resp.routes[0];
      this.createRoute(this.routes.overview_polyline.points);
    }

    console.log(this.routes);
  }

  private createRoute(polyline) {
    const route = new ol.format.Polyline({
      factor: 1e5
    }).readGeometry(polyline, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    });

    const feature = new ol.Feature({
      type: 'route',
      geometry: route
    });

    feature.setStyle(AppComponent.ROUTE_STYLE);

    this.vectorSource.addFeature(feature);
  }

}
