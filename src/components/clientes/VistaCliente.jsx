import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Spinner, Button, Form, Alert } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig.js';
import NotificacionOperacion from '../rutas/NotificacionOperacion.jsx'; // Asumiendo que tienes este componente

const VistaCliente = () => {
    const [perfil, setPerfil] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [archivoFoto, setArchivoFoto] = useState(null);
    const [editandoFoto, setEditandoFoto] = useState(false);
    const [toast, setToast] = useState({ mostrar: false, mensaje: "", tipo: "" });
    const [perfilMensaje, setPerfilMensaje] = useState("");
    const bucketName = 'imagenes_personas';

    const cargarDatosPerfil = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setPerfil(null);
                setPerfilMensaje('No hay sesión activa. Inicia sesión para ver tu perfil.');
                return;
            }

            const { data, error } = await supabase
                .from('clientes')
                .select('*, foto_cliente') // Asegúrate de seleccionar el campo de la foto
                .eq('profile_id', user.id)
                .single();

            if (error) {
                if (error.details?.includes('Result contains no rows')) {
                    setPerfil(null);
                    setPerfilMensaje('No se encontró tu perfil de cliente. Verifica la tabla clientes y el profile_id.');
                } else {
                    throw error;
                }
            } else {
                setPerfil(data);
                setPerfilMensaje('');
            }
        } catch (err) {
            console.error("Error al cargar perfil:", err.message);
            setPerfil(null);
            setPerfilMensaje(err.message || 'Ocurrió un error al cargar tu perfil.');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatosPerfil();
    }, []);

    const manejoCambioArchivo = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setArchivoFoto(file);
        } else {
            setToast({ mostrar: true, mensaje: "Por favor, selecciona un archivo de imagen válido.", tipo: "advertencia" });
            setArchivoFoto(null);
        }
    };

    const subirFotoPerfil = async () => {
        if (!archivoFoto) {
            setToast({ mostrar: true, mensaje: "Por favor, selecciona una imagen para subir.", tipo: "advertencia" });
            return;
        }

        setCargando(true);
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error("Usuario no autenticado.");

            const nombreArchivo = `${user.id}_${Date.now()}_${archivoFoto.name}`;
            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(nombreArchivo, archivoFoto);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(nombreArchivo);
            const nuevaUrl = urlData.publicUrl;

            // Eliminar foto antigua si existe
            if (perfil?.foto_cliente) {
                const oldFileName = perfil.foto_cliente.split('/').pop().split('?')[0];
                await supabase.storage.from(bucketName).remove([oldFileName]);
            }

            const { error: updateError } = await supabase
                .from('clientes')
                .update({ foto_cliente: nuevaUrl })
                .eq('profile_id', user.id);

            if (updateError) throw updateError;

            setPerfil(prev => ({ ...prev, foto_cliente: nuevaUrl }));
            setArchivoFoto(null);
            setEditandoFoto(false);
            setToast({ mostrar: true, mensaje: "Foto de perfil actualizada exitosamente.", tipo: "exito" });

            // Notificar al menú/encabezado sobre la actualización de la foto
            window.dispatchEvent(new CustomEvent("actualizacion-foto-perfil", { detail: { foto_cliente: nuevaUrl } }));

        } catch (err) {
            console.error("Error al subir foto de perfil:", err.message);
            setToast({ mostrar: true, mensaje: `Error al actualizar la foto: ${err.message}`, tipo: "error" });
        } finally {
            setCargando(false);
        }
    };

    const eliminarFotoPerfil = async () => {
        if (!perfil?.foto_cliente) return;

        setCargando(true);
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error("Usuario no autenticado.");

            const oldFileName = perfil.foto_cliente.split('/').pop().split('?')[0];
            const { error: removeError } = await supabase.storage.from(bucketName).remove([oldFileName]);
            if (removeError) throw removeError;

            const { error: updateError } = await supabase
                .from('clientes')
                .update({ foto_cliente: null })
                .eq('profile_id', user.id);

            if (updateError) throw updateError;

            setPerfil(prev => ({ ...prev, foto_cliente: null }));
            setToast({ mostrar: true, mensaje: "Foto de perfil eliminada exitosamente.", tipo: "exito" });

            // Notificar al menú/encabezado sobre la eliminación de la foto
            window.dispatchEvent(new CustomEvent("actualizacion-foto-perfil", { detail: { foto_cliente: null } }));

        } catch (err) {
            console.error("Error al eliminar foto de perfil:", err.message);
            setToast({ mostrar: true, mensaje: `Error al eliminar la foto: ${err.message}`, tipo: "error" });
        } finally {
            setCargando(false);
        }
    };

    if (cargando) return <Container className="text-center py-5"><Spinner animation="border" className="text-gold" /></Container>;

    if (!cargando && perfil === null) return (
        <Container className="text-center py-5">
            <h3 className="text-warning">No se encontró tu perfil de cliente.</h3>
            <p className="text-muted">{perfilMensaje || 'Verifica que tu cuenta tenga un registro en la tabla clientes con el mismo profile_id que tu usuario Supabase.'}</p>
        </Container>
    );

    return (
        <div className="bg-radial-premium">
            <Container className="py-5">
            <Row className="g-4">
                {/* Columna Izquierda: Tarjeta de Identidad y Foto */}
                <Col lg={4}>
                    <Card className="perfil-card text-white text-center p-4">
                        <Card.Body>
                            <div className="avatar-container d-flex justify-content-center mb-3">
                                {perfil?.foto_cliente ? (
                                    <img
                                        src={perfil.foto_cliente}
                                        alt="Foto de Perfil"
                                        className="avatar-img"
                                    />
                                ) : (
                                    <div 
                                        className="avatar-img d-flex align-items-center justify-content-center bg-dark"
                                        style={{ backgroundColor: '#1a1a1a !important' }}
                                    >
                                        <i className="bi bi-person-fill text-white" style={{ fontSize: '70px' }}></i>
                                    </div>
                                )}
                            </div>
                            
                            <h4 className="fw-bold mb-1 text-gold">
                                {perfil?.nombres} {perfil?.apellidos}
                            </h4>
                            <span className="badge rounded-pill badge-custom px-3 py-2 fw-bold text-uppercase mb-4">
                                Cliente Ouroboros
                            </span>

                            <hr className="border-secondary my-4" />

                            <div className="d-flex flex-column gap-2 justify-content-center">
                                {!editandoFoto ? (
                                    <>
                                        <Button
                                            className="btn-outline-gold w-100 py-2"
                                            onClick={() => setEditandoFoto(true)}
                                            disabled={cargando}
                                        >
                                            <i className="bi bi-camera me-2"></i>
                                            {perfil?.foto_cliente ? 'Cambiar Foto de Perfil' : 'Agregar Foto de Perfil'}
                                        </Button>
                                        {perfil?.foto_cliente && (
                                            <Button
                                                className="btn-danger-custom w-100 py-2"
                                                onClick={eliminarFotoPerfil}
                                                disabled={cargando}
                                            >
                                                <i className="bi bi-trash me-2"></i>
                                                Eliminar Foto
                                            </Button>
                                        )}
                                    </>
                                ) : (
                                    <div className="d-flex flex-column align-items-center w-100">
                                        <Form.Group controlId="formFile" className="mb-3 w-100 text-start">
                                            <Form.Label className="text-muted small">Selecciona una nueva foto de perfil</Form.Label>
                                            <Form.Control type="file" accept="image/*" onChange={manejoCambioArchivo} className="form-control-custom" />
                                        </Form.Group>
                                        <div className="d-flex gap-2 w-100">
                                            <Button className="btn-gold flex-grow-1" onClick={subirFotoPerfil} disabled={cargando || !archivoFoto}>
                                                Guardar
                                            </Button>
                                            <Button className="btn-secondary-custom flex-grow-1" onClick={() => { setEditandoFoto(false); setArchivoFoto(null); }} disabled={cargando}>
                                                Cancelar
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Columna Derecha: Detalles del Cliente */}
                <Col lg={8}>
                    <Card className="perfil-card text-white p-4 h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center gap-3 mb-4">
                                <i className="bi bi-person-lines-fill text-gold" style={{ fontSize: '1.8rem' }}></i>
                                <h3 className="fw-bold mb-0 text-gold">Datos del Perfil</h3>
                            </div>

                            <div className="perfil-welcome-banner mb-4">
                                <h6 className="fw-bold mb-1 text-gold">¡Bienvenido a tu Espacio Personal!</h6>
                                <p className="mb-0 small text-white-50">
                                    Aquí puedes revisar la información que nos proporcionaste al momento de crear tu cuenta. Si deseas agendar una cita o ver tu historial de atención, utiliza los accesos del menú principal.
                                </p>
                            </div>

                            <Row className="g-3">
                                {/* Nombres */}
                                <Col md={6}>
                                    <div className="perfil-info-block d-flex align-items-center gap-3">
                                        <div className="perfil-icon-wrapper">
                                            <i className="bi bi-person"></i>
                                        </div>
                                        <div>
                                            <span className="text-white-50 small text-uppercase d-block fw-bold">Nombres</span>
                                            <span className="h6 mb-0 text-white fw-semibold d-block text-truncate">{perfil?.nombres}</span>
                                        </div>
                                    </div>
                                </Col>

                                {/* Apellidos */}
                                <Col md={6}>
                                    <div className="perfil-info-block d-flex align-items-center gap-3">
                                        <div className="perfil-icon-wrapper">
                                            <i className="bi bi-person-badge"></i>
                                        </div>
                                        <div>
                                            <span className="text-white-50 small text-uppercase d-block fw-bold">Apellidos</span>
                                            <span className="h6 mb-0 text-white fw-semibold d-block text-truncate">{perfil?.apellidos}</span>
                                        </div>
                                    </div>
                                </Col>

                                {/* Cédula */}
                                <Col md={6}>
                                    <div className="perfil-info-block d-flex align-items-center gap-3">
                                        <div className="perfil-icon-wrapper">
                                            <i className="bi bi-card-text"></i>
                                        </div>
                                        <div>
                                            <span className="text-white-50 small text-uppercase d-block fw-bold">Cédula de Identidad</span>
                                            <span className="h6 mb-0 text-white fw-semibold d-block text-truncate">{perfil?.cedula}</span>
                                        </div>
                                    </div>
                                </Col>

                                {/* Teléfono */}
                                <Col md={6}>
                                    <div className="perfil-info-block d-flex align-items-center gap-3">
                                        <div className="perfil-icon-wrapper">
                                            <i className="bi bi-telephone"></i>
                                        </div>
                                        <div>
                                            <span className="text-white-50 small text-uppercase d-block fw-bold">Teléfono de Contacto</span>
                                            <span className="h6 mb-0 text-white fw-semibold d-block text-truncate">{perfil?.telefono || 'No registrado'}</span>
                                        </div>
                                    </div>
                                </Col>

                                {/* Dirección */}
                                <Col xs={12}>
                                    <div className="perfil-info-block d-flex align-items-center gap-3">
                                        <div className="perfil-icon-wrapper">
                                            <i className="bi bi-geo-alt"></i>
                                        </div>
                                        <div>
                                            <span className="text-white-50 small text-uppercase d-block fw-bold">Dirección de Domicilio</span>
                                            <span className="h6 mb-0 text-white fw-semibold d-block" style={{ whiteSpace: 'pre-line' }}>{perfil?.direccion || 'No registrada'}</span>
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <NotificacionOperacion
                mostrar={toast.mostrar}
                mensaje={toast.mensaje}
                tipo={toast.tipo}
                onClose={() => setToast({ mostrar: false, mensaje: "", tipo: "" })}
            />
            </Container>
        </div>
    );
};

export default VistaCliente;