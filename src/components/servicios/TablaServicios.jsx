import { Table, Button, Badge } from 'react-bootstrap';
import PropTypes from 'prop-types';

const TablaServicios = ({ servicios, onEditar, onEliminar }) => {
    return (
        <div className="table-responsive rounded shadow-sm">
            <Table hover responsive className="align-middle mb-0 table-custom">
                <thead>
                    <tr>
                        <th className="ps-4">ID</th>
                        <th>TIPO DE SERVICIO</th>
                        <th>PRECIO</th>
                        <th className="text-center">ACCIONES</th>
                    </tr>
                </thead>
                <tbody>
                    {servicios.length === 0 ? (
                        <tr>
                            <td colSpan="4" className="text-center py-4 text-white-50">
                                No hay servicios de mantenimiento registrados.
                            </td>
                        </tr>
                    ) : (
                        servicios.map((servicio) => (
                            <tr key={servicio.id_servicio}>
                                <td className="ps-4 text-white fw-bold">#{servicio.id_servicio}</td>
                                <td>
                                    <div className="fw-semibold text-white">{servicio.tipo_servicio}</div>
                                </td>
                                <td>
                                    {servicio.precio_servicio != null ? (
                                        <Badge className="badge-custom">
                                            ${Number(servicio.precio_servicio).toFixed(2)}
                                        </Badge>
                                    ) : (
                                        <span className="text-white-50">N/A</span>
                                    )}
                                </td>
                                <td className="text-center">
                                    <div className="d-flex justify-content-center gap-2">
                                        <Button
                                            variant="outline-warning"
                                            size="sm"
                                            onClick={() => onEditar(servicio)}
                                            title="Editar Servicio"
                                            className="btn-outline-gold"
                                        >
                                            <i className="bi bi-pencil-square"></i>
                                        </Button>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => onEliminar(servicio)}
                                            title="Eliminar Servicio"
                                            className="btn-outline-danger-custom"
                                        >
                                            <i className="bi bi-trash"></i>
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </Table>
        </div>
    );
};

TablaServicios.propTypes = {
    servicios: PropTypes.array.isRequired,
    onEditar: PropTypes.func.isRequired,
    onEliminar: PropTypes.func.isRequired,
};

export default TablaServicios;