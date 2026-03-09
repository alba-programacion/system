import React, { useEffect, useState } from "react";
import axios from "axios";
import HamburgerMenu from "../components/HamburgerMenu";

export default function Home() {
  const [publicidad, setPublicidad] = useState([]);
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const pubRes = await axios.get("http://localhost:3000/api/public/publicidad");
      const vidRes = await axios.get("http://localhost:3000/api/public/videos");
      setPublicidad(pubRes.data);
      setVideos(vidRes.data);
    };
    fetchData();
  }, []);

  return (
    <div style={{ background: "#111", color: "#fff", minHeight: "100vh" }}>
      
      <header style={{ display: "flex", justifyContent: "space-between", padding: "1rem" }}>
        <h1>Portal SI-ECAD</h1>
        <HamburgerMenu />
      </header>

    
      <section style={{ padding: "2rem" }}>
        <h2>Publicidad</h2>
        {publicidad.map((item) => (
          <div key={item._id} style={{ marginBottom: "1rem" }}>
            <h3>{item.titulo}</h3>
            <p>{item.descripcion}</p>
            {item.imagenUrl && <img src={item.imagenUrl} alt={item.titulo} style={{ width: "100%" }} />}
            {item.enlace && <a href={item.enlace} style={{ color: "#4da6ff" }}>Ver más</a>}
          </div>
        ))}
      </section>

      
      <section style={{ padding: "2rem" }}>
        <h2>Videos</h2>
        {videos.map((vid) => (
          <div key={vid._id} style={{ marginBottom: "1rem" }}>
            <h3>{vid.titulo}</h3>
            <p>{vid.descripcion}</p>
            <video width="100%" controls>
              <source src={vid.url} type="video/mp4" />
              Tu navegador no soporta video.
            </video>
          </div>
        ))}
      </section>
    </div>
  );
}
