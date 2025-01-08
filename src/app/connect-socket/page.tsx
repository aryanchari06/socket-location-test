"use client";

import { io, Socket } from "socket.io-client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Coords {
  lat: number;
  long: number;
}

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io("http://localhost:8000");
  }

  return socket;
};

const Page = () => {
  const [userCoords, setUserCoords] = useState<Coords>();
  const socket = useMemo(() => getSocket(), []);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize the map only on the client side
  useEffect(() => {
    if (typeof window !== "undefined" && userCoords?.lat && userCoords?.long) {
      mapRef.current = L.map("map").setView([userCoords.lat, userCoords.long], 19);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapRef.current);

      markersLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }
  }, [userCoords]);

  // Get user coordinates using Geolocation API
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            long: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error fetching coordinates: ", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, []);

  // Handle socket connections
  useEffect(() => {
    socket.on("connect", () => {
      console.log("User is connected");
    });

    socket.on("coords", (data) => {
      console.log("Received coords: ", data.coords);
      addMarker(data.coords, data.id);
    });

    socket.on("live-users", (users) => {
      console.log("Live users: ", users);
    });

    return () => {
      socket.off("coords"); // Remove listeners to prevent memory leaks
      socket.off("live-users");
      socket.disconnect();
    };
  }, [socket]);

  useEffect(() => {
    if (userCoords?.lat && userCoords?.long) {
      socket.emit("user-coords", userCoords);
    }
  }, [userCoords, socket]);

  const addMarker = (coords: Coords, id: string) => {
    if (markersLayerRef.current) {
      const customIcon = L.icon({
        iconUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLWRQ2MP28ucwL3bUexiJ8kfDjKM_IO6TCrw&s",
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
      });

      const marker = L.marker([coords.lat, coords.long], {
        icon: customIcon,
      }).bindPopup(`User ${id}`);
      markersLayerRef.current.addLayer(marker);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-6">
      <div className="w-full bg-white p-6 rounded-lg shadow-lg space-y-4">
        <div>
          <div id="map" className="h-[80vh] w-full"></div>
        </div>
      </div>
    </div>
  );
};

export default Page;
