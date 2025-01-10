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
  const [userCoords, setUserCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<string>("Initializing...");
  const socket = useMemo(() => getSocket(), []);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const markers = useRef<Map<string, L.Marker>>(new Map()); // Track markers by ID

  // initializing map
  useEffect(() => {
    if (typeof window !== "undefined" && userCoords) {
      mapRef.current = L.map("map").setView(
        [userCoords.lat, userCoords.long],
        16
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapRef.current);

      markersLayerRef.current = L.layerGroup().addTo(mapRef.current);
      console.log(userCoords);

      // add user's coordinate marker on the map
      addOrUpdateMarker(userCoords, "You");
    }
  }, [userCoords]);

  // fetch user coordinates
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
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

  //sockets
  useEffect(() => {
    socket.on("connect", () => {
      setStatus("Connected to server.");
    });

    socket.on("wait-message", (message) => {
      console.log(message);
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
  }, [userCoords]);

  const addOrUpdateMarker = (coords: Coords, id: string) => {
    if (markersLayerRef.current) {
      const existingMarker = markers.current.get(id);

      if (existingMarker) {
        // Update existing marker position
        existingMarker.setLatLng([coords.lat, coords.long]);
      } else {
        // Add a new marker
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

        markers.current.set(id, marker); // Track the marker by ID
        markersLayerRef.current.addLayer(marker);
      }
    }
  };

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
