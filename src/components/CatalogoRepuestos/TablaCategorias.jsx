import React from 'react';
import { Table, Button } from 'react-bootstrap';

const TablaCategorias = ({ categorias, alEditar, alEliminar }) => {
    return (
        <div className="table-responsive shadow-sm rounded">
            <Table hover className="bg-white mb-0 align-middle">
                <thead className="table-light">
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th className="text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {categorias.map((cat) => (
                        <tr key={cat.id_categoria}>
                            <td>#{cat.id_categoria}</td>
                            <td className="fw-semibold">{cat.nombre}</td>
                            <td className="text-center">
                                <Button 
                                    variant="outline-primary" 
                                    size="sm" 
                                    className="me-2"
                                    onClick={() => alEditar(cat)}
                                >
                                    <i className="bi bi-pencil"></i>
                                </Button>
                                <Button 
                                    variant="outline-danger" 
                                    size="sm"
                                    onClick={() => alEliminar(cat)}
                                >
                                    <i className="bi bi-trash"></i>
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

export default TablaCategorias;