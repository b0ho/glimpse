import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS } from '@/utils/constants';

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  type: 'user' | 'group' | 'place';
  data?: any;
}

interface KakaoMapViewProps {
  center: Location;
  markers?: MapMarker[];
  onMarkerPress?: (marker: MapMarker) => void;
  onMapPress?: (location: Location) => void;
  style?: any;
  zoom?: number;
  showCurrentLocation?: boolean;
}

export const KakaoMapView: React.FC<KakaoMapViewProps> = ({
  center,
  markers = [],
  onMarkerPress,
  onMapPress,
  style,
  zoom = 3,
  showCurrentLocation = true,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const kakaoMapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <title>Kakao Map</title>
        <script type="text/javascript" src="//dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_KAKAO_API_KEY&autoload=false"></script>
        <style>
            body, html { margin: 0; padding: 0; width: 100%; height: 100%; }
            #map { width: 100%; height: 100%; }
            .custom-overlay {
                position: relative;
                bottom: 85px;
                border-radius: 6px;
                border: 1px solid #ccc;
                border-bottom: 2px solid #ddd;
                float: left;
            }
            .custom-overlay:nth-of-type(n) {
                border: 0;
                box-shadow: 0px 1px 2px #888;
            }
            .custom-overlay a {
                display: block;
                text-decoration: none;
                color: #000;
                text-align: center;
                border-radius: 6px;
                font-size: 14px;
                font-weight: bold;
                overflow: hidden;
                background: #d95050;
                background: #d95050 url(https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/arrow_white.png) no-repeat right 14px center;
            }
            .custom-overlay .title {
                display: block;
                text-align: center;
                background: #fff;
                margin-right: 35px;
                padding: 10px 15px;
                font-size: 14px;
                font-weight: bold;
            }
            .custom-overlay:after {
                content: '';
                position: absolute;
                margin-left: -12px;
                left: 50%;
                bottom: -12px;
                width: 22px;
                height: 12px;
                background: url('https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/vertex_white.png');
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            let map;
            let markers = [];
            
            // Kakao Maps API 로드 완료 후 초기화
            kakao.maps.load(function() {
                initializeMap();
            });
            
            function initializeMap() {
                const container = document.getElementById('map');
                const options = {
                    center: new kakao.maps.LatLng(${center.latitude}, ${center.longitude}),
                    level: ${zoom}
                };
                
                map = new kakao.maps.Map(container, options);
                
                // 지도 클릭 이벤트
                kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
                    const latlng = mouseEvent.latLng;
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'mapClick',
                        latitude: latlng.getLat(),
                        longitude: latlng.getLng()
                    }));
                });
                
                // 현재 위치 표시
                ${showCurrentLocation ? `
                const currentLocationMarker = new kakao.maps.Marker({
                    position: new kakao.maps.LatLng(${center.latitude}, ${center.longitude}),
                    image: new kakao.maps.MarkerImage(
                        'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
                        new kakao.maps.Size(24, 35)
                    )
                });
                currentLocationMarker.setMap(map);
                ` : ''}
                
                // 마커 추가
                addMarkers(${JSON.stringify(markers)});
                
                // 맵 준비 완료 알림
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'mapReady'
                }));
            }
            
            function addMarkers(markerData) {
                // 기존 마커 제거
                markers.forEach(marker => marker.setMap(null));
                markers = [];
                
                markerData.forEach(markerInfo => {
                    const markerPosition = new kakao.maps.LatLng(markerInfo.latitude, markerInfo.longitude);
                    
                    // 마커 타입에 따른 이미지 설정
                    let markerImage;
                    switch(markerInfo.type) {
                        case 'user':
                            markerImage = new kakao.maps.MarkerImage(
                                'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png',
                                new kakao.maps.Size(29, 42)
                            );
                            break;
                        case 'group':
                            markerImage = new kakao.maps.MarkerImage(
                                'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_blue.png',
                                new kakao.maps.Size(29, 42)
                            );
                            break;
                        case 'place':
                            markerImage = new kakao.maps.MarkerImage(
                                'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_green.png',
                                new kakao.maps.Size(29, 42)
                            );
                            break;
                        default:
                            markerImage = null;
                    }
                    
                    const marker = new kakao.maps.Marker({
                        position: markerPosition,
                        image: markerImage
                    });
                    
                    marker.setMap(map);
                    markers.push(marker);
                    
                    // 마커 클릭 이벤트
                    kakao.maps.event.addListener(marker, 'click', function() {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'markerClick',
                            marker: markerInfo
                        }));
                    });
                    
                    // 인포윈도우 (선택사항)
                    if (markerInfo.title) {
                        const infoWindow = new kakao.maps.InfoWindow({
                            content: '<div class="custom-overlay"><div class="title">' + markerInfo.title + '</div></div>'
                        });
                        
                        // 마커에 mouseover 이벤트와 mouseout 이벤트를 등록합니다
                        kakao.maps.event.addListener(marker, 'mouseover', function() {
                            infoWindow.open(map, marker);
                        });
                        
                        kakao.maps.event.addListener(marker, 'mouseout', function() {
                            infoWindow.close();
                        });
                    }
                });
            }
            
            // React Native에서 호출할 수 있는 함수들
            function updateCenter(lat, lng) {
                if (map) {
                    const moveLatLon = new kakao.maps.LatLng(lat, lng);
                    map.setCenter(moveLatLon);
                }
            }
            
            function updateMarkers(newMarkers) {
                addMarkers(newMarkers);
            }
            
            function setZoomLevel(level) {
                if (map) {
                    map.setLevel(level);
                }
            }
        </script>
    </body>
    </html>
  `;

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'mapReady':
          setIsMapReady(true);
          break;
        case 'mapClick':
          if (onMapPress) {
            onMapPress({
              latitude: data.latitude,
              longitude: data.longitude,
            });
          }
          break;
        case 'markerClick':
          if (onMarkerPress) {
            onMarkerPress(data.marker);
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('WebView message parsing error:', error);
    }
  };

  // 마커 업데이트
  useEffect(() => {
    if (isMapReady && webViewRef.current) {
      const script = `updateMarkers(${JSON.stringify(markers)});`;
      webViewRef.current.postMessage(script);
    }
  }, [markers, isMapReady]);

  // 중심점 업데이트
  useEffect(() => {
    if (isMapReady && webViewRef.current) {
      const script = `updateCenter(${center.latitude}, ${center.longitude});`;
      webViewRef.current.postMessage(script);
    }
  }, [center, isMapReady]);

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: kakaoMapHTML }}
        style={styles.webView}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={Platform.OS === 'android'}
        mixedContentMode="compatibility"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        onError={(error) => {
          console.error('WebView error:', error);
          Alert.alert('지도 오류', '지도를 로드할 수 없습니다.');
        }}
        onHttpError={(error) => {
          console.error('WebView HTTP error:', error);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  webView: {
    flex: 1,
  },
});