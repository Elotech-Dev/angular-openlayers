import { Http, Headers } from '@angular/http';
import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

const ol = require('openlayers');

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  private static API_KEY = 'AIzaSyAPWRnUuIp7RA1fBI7gMWYsAzMZn2HIsCM';

  private static GOOGLE_MAPS_URL = `maps/api/directions/json?key=${AppComponent.API_KEY}`;

  private static GOOGLE_ROADS_URL = `v1/nearestRoads?key=${AppComponent.API_KEY}`;


  private static ROUTE_STYLE = new ol.style.Style({
    stroke: new ol.style.Stroke({
      width: 6, color: [40, 40, 40, 0.8]
    })
  });

  private static PLACE_STYLE = new ol.style.Style({
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
  private roadsSubscription: Subscription;


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


    this.map.on('click', evt => this.handleClick(evt));

  }

  clear() {
    this.msg = 'Select source...';
    this.coordinates = [];
    this.vectorSource.clear();
    this.resp = null;
  }



  private handleClick(evt) {

    if ((!this.roadsSubscription || this.roadsSubscription.closed) && this.coordinates.length < 2) {

      const latLog = this.coordinateToLatLog(evt.coordinate);

      this.roadsSubscription = this.http.get(`${AppComponent.GOOGLE_ROADS_URL}&points=${latLog}`)
        .subscribe(resp => {

          const point = resp.json();

          const location = point.snappedPoints[0].location;

          this.createPlace([location.longitude, location.latitude]);

          this.addPlace([location.latitude, location.longitude]);

        });


    }

  }


  private addPlace(latLog) {

    this.coordinates.push(latLog);

    if (this.coordinates.length > 1) {
      this.msg = 'Calculating route...';

      this.http.get(`${AppComponent.GOOGLE_MAPS_URL}&origin=${this.coordinates[0]}&destination=${this.coordinates[1]}`)
        .subscribe(resp => this.handleResponse(resp));

    } else {
      this.msg = 'Select target...';
    }

  }

  private createPlace(latLog) {
    const place = new ol.Feature({
      type: 'place',
      geometry: new ol.geom.Point(ol.proj.fromLonLat(latLog))
    });
    place.setStyle(AppComponent.PLACE_STYLE);
    this.vectorSource.addFeature(place);
  }


  private coordinateToLatLog(coordinate) {
    const points = ol.proj.transform(coordinate, 'EPSG:3857', 'EPSG:4326');
    return [points[1], points[0]];
  }

  private handleResponse(response) {
    this.resp = response.json();
    this.routes = null;
    if (this.resp.routes.length > 0) {
      this.routes = this.resp.routes[0];
      this.createRoute(this.routes.overview_polyline.points);
    }
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
