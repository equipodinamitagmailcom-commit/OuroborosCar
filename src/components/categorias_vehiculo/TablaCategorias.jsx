import { useState, useEffect } from "react";
import { Table, Spinner, Button } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";


const TablaCategorias = ({ categorias, abrirModalEdicion, abrirModalEliminacion }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (categorias && categorias.length > 0) {
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [categorias]);

  return (
    <>
      {loading ? (
        <div className="text-center">
          <h4>Cargando categorías...</h4>
          <Spinner animation="border" variant="success" role="status" />
        </div>
      ) : (
        <Table striped borderless hover responsive size="sm">
          <thead>
            <tr>
              <th>Id</th>
              <th>Nombre</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categorias.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center">
                  No hay categorías registradas
                </td>
              </tr>
            ) : (
              categorias.map((categoria) => (
                <tr key={categoria.id_categoria}>
                  <td>{categoria.id_categoria}</td>
                  <td>{categoria.nombrecat}</td>
                  <td className="text-center">
                    <Button
                      variant="outline-warning"
                      size="sm"
                      className="m-1"
                      onClick={() => abrirModalEdicion(categoria)}
                    >
                      <i className="bi bi-pencil"></i>
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => abrirModalEliminacion(categoria)}
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}
    </>
  );
};

export default TablaCategorias;