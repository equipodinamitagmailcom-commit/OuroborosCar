import React from 'react';
import { Carousel } from 'react-bootstrap';

const CarruselVehiculo = ({ vehiculo, height = "200px" }) => {
  const imagenes = [
    { url: vehiculo.url_imagen, label: "Frente del vehículo" },
    { url: vehiculo.url_imagen2, label: "Trasero del vehículo" },
    { url: vehiculo.url_imagen3, label: "Costado del vehículo" },
    { url: vehiculo.url_imagen4, label: "Interior del vehículo" }
  ].filter(img => img.url);

  if (imagenes.length === 0) {
    return (
      <div 
        style={{ 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          backgroundColor: '#1e1e1e', 
          color: '#666', 
          borderRadius: '4px',
          border: '1px solid #333'
        }}
      >
        <span>Sin imagen</span>
      </div>
    );
  }

  const showControls = imagenes.length > 1;

  return (
    <Carousel 
      interval={3500} 
      controls={showControls} 
      indicators={showControls}
      pause="hover"
      style={{ borderRadius: '4px', overflow: 'hidden' }}
    >
      {imagenes.map((img, idx) => (
        <Carousel.Item key={idx}>
          <img
            src={img.url}
            alt={`${img.label} - ${vehiculo.marca || ''} ${vehiculo.modelo || ''}`}
            className="w-100"
            style={{ height, objectFit: "cover" }}
          />
          <Carousel.Caption 
            style={{ 
              background: 'rgba(18, 18, 18, 0.75)', 
              left: '0', 
              right: '0', 
              bottom: '0', 
              padding: '6px 10px', 
              fontSize: '11px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              borderTop: '1px solid rgba(164, 132, 28, 0.3)'
            }}
          >
            <span style={{ color: "#A4841C", fontWeight: "bold" }}>{img.label}</span>
          </Carousel.Caption>
        </Carousel.Item>
      ))}
    </Carousel>
  );
};

export default CarruselVehiculo;
