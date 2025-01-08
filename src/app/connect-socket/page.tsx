"use client";

import { io } from "socket.io-client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Coords {
  lat: number;
  long: number;
}
const page = () => {
  const [userCoords, setUserCoords] = useState<Coords>();

  const socket = useMemo(() => io("http://localhost:8000"), []);

  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const initializeMap = () => {
    if (userCoords?.lat && userCoords.long) {
      mapRef.current = L.map("map").setView(
        [userCoords?.lat, userCoords?.long],
        19
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapRef.current);

      markersLayerRef.current = L.layerGroup().addTo(mapRef.current);

      // if (userCoords?.lat && userCoords.long) {
      //   addMarker(userCoords);
      // }
    }
  };

  useEffect(() => {
    initializeMap();
  }, [userCoords]);

  useEffect(() => {
    getUserCoords();
    socket.on("connect", () => {
      console.log("User is connected");
    });

    socket.on("coords", (coords) => {
      console.log("Coords: ", coords);
      addMarker(coords.coords);
    });
  }, []);

  useEffect(() => {
    if (userCoords?.lat && userCoords.long) {
      socket.emit("user-coords", userCoords);
    }
  }, [userCoords?.lat, userCoords?.long]);

  const getUserCoords = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          long: position.coords.longitude,
        };
        console.log(coords);
        setUserCoords(coords);
      },
      (error) => {
        console.error("Error while fetching user coordinates: ", error);
        return;
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const addMarker = (coords: Coords) => {
    if (!markersLayerRef.current) return;

    const customIcon = L.icon({
      iconUrl:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLWRQ2MP28ucwL3bUexiJ8kfDjKM_IO6TCrw&s",
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    });

    const marker = L.marker([coords.lat, coords.long], {
      icon: customIcon,
    }).bindPopup("You are here");

    markersLayerRef.current.addLayer(marker);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-6">
      <div className="w-full  bg-white p-6 rounded-lg shadow-lg space-y-4">
        {/* <div className="flex space-x-4">
          <button
            onClick={sendCoords}
            className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Send Coords
          </button>
        </div> */}

        <div>
          <div id="map" className="h-[80vh] w-full"></div>
        </div>
      </div>
    </div>
  );
};

export default page;
