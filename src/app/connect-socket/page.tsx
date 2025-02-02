"use client";

import { io, Socket } from "socket.io-client";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Coords {
  lat: number;
  long: number;
}

let socket: Socket | null = null;

const getSocket = () => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000");
  }
  return socket;
};

const Page = () => {
  const [userCoords, setUserCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<string>("Initializing...");
  const socket = useMemo(() => getSocket(), []);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const markers = useRef<Map<string, L.Marker>>(new Map());

  const addOrUpdateMarker = useCallback((coords: Coords, id: string) => {
    if (markersLayerRef.current) {
      const existingMarker = markers.current.get(id);

      if (existingMarker) {
        existingMarker.setLatLng([coords.lat, coords.long]);
      } else {
        const customIcon = L.icon({
          iconUrl:
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLWRQ2MP28ucwL3bUexiJ8kfDjKM_IO6TCrw&s",
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          popupAnchor: [0, -40],
        });

        const marker = L.marker([coords.lat, coords.long], {
          icon: customIcon,
        }).bindPopup(id);

        markers.current.set(id, marker);
        markersLayerRef.current.addLayer(marker);
      }
    }
  }, []);

  useEffect(() => {
    if (userCoords) {
      mapRef.current = L.map("map").setView(
        [userCoords.lat, userCoords.long],
        16
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapRef.current);

      markersLayerRef.current = L.layerGroup().addTo(mapRef.current);

      addOrUpdateMarker(userCoords, "You");
    }
  }, [userCoords, addOrUpdateMarker]);

  useEffect(() => {
    if (userCoords) console.log("Own coords: ", userCoords);
  }, [userCoords]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            long: position.coords.longitude,
          });
          setStatus("Location fetched.");
        },
        (error) => {
          console.error("Error fetching coordinates: ", error);
          setStatus("Error fetching location.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, []);

  useEffect(() => {
    socket.on("connect", () => {
      setStatus("Connected to server.");
    });

    socket.on("wait-message", (message) => {
      console.log(message.message);
      setStatus(message.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  useEffect(() => {
    socket.on("paired", (message) => {
      console.log(message);
      if (userCoords) {
        socket.emit("user-coords", userCoords);
        setStatus("Paired! Sharing location...");
      }
    });

    socket.on("user-coords", (data: { coords: Coords; user: string }) => {
      console.log("Received coords from paired user:", data);
      addOrUpdateMarker(data.coords, data.user);
      setStatus("Location updated with paired user.");
    });

    return () => {
      socket.off("paired");
      socket.off("user-coords");
    };
  }, [userCoords, socket, addOrUpdateMarker]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-6">
      <div className="w-full bg-white p-6 rounded-lg shadow-lg space-y-4">
        <p className="text-lg font-semibold">{status}</p>
        <div id="map" className="h-[80vh] w-full"></div>
      </div>
    </div>
  );
};

export default Page;
