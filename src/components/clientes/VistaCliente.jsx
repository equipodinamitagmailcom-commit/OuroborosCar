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

    if (cargando) return <Container className="text-center py-5"><Spinner animation="border" variant="warning" /></Container>;

    if (!cargando && perfil === null) return (
        <Container className="text-center py-5">
            <h3 className="text-warning">No se encontró tu perfil de cliente.</h3>
            <p className="text-muted">{perfilMensaje || 'Verifica que tu cuenta tenga un registro en la tabla clientes con el mismo profile_id que tu usuario Supabase.'}</p>
        </Container>
    );

    return (
        <div 
            style={{ 
                backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(164, 132, 28, 0.22) 0%, rgba(10, 10, 10, 1) 85%)',
                backgroundColor: '#0a0a0a',
                minHeight: 'calc(100vh - 70px)',
                padding: '40px 20px',
                margin: '-20px -20px -20px -20px',
                backgroundAttachment: 'fixed'
            }}
        >
            <Container 
                className="py-5" 
                style={{ color: '#e0e0e0', marginTop: '60px' }}
            >
            <style>
                {`
                    .perfil-card {
                        background: rgba(18, 18, 18, 0.8) !important;
                        backdrop-filter: blur(16px);
                        -webkit-backdrop-filter: blur(16px);
                        border: 1px solid rgba(164, 132, 28, 0.3) !important;
                        border-radius: 16px;
                        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5), 0 0 15px rgba(164, 132, 28, 0.1);
                        transition: all 0.3s ease;
                    }
                    .perfil-card:hover {
                        border-color: rgba(164, 132, 28, 0.6) !important;
                        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.6), 0 0 25px rgba(164, 132, 28, 0.25);
                    }
                    .perfil-info-block {
                        background: rgba(12, 12, 12, 0.65) !important;
                        backdrop-filter: blur(8px);
                        -webkit-backdrop-filter: blur(8px);
                        border: 1px solid rgba(255, 255, 255, 0.04);
                        border-radius: 12px;
                        padding: 20px;
                        height: 100%;
                        transition: all 0.3s ease;
                        display: flex;
                        align-items: center;
                        gap: 15px;
                    }
                    .perfil-info-block:hover {
                        border-color: #A4841C;
                        transform: translateY(-2px);
                        box-shadow: 0 4px 15px rgba(164, 132, 28, 0.2);
                        background: rgba(15, 15, 15, 0.85) !important;
                    }
                    .perfil-icon-wrapper {
                        background: rgba(164, 132, 28, 0.1);
                        color: #A4841C;
                        border-radius: 10px;
                        width: 45px;
                        height: 45px;
                        min-width: 45px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.4rem;
                        border: 1px solid rgba(164, 132, 28, 0.2);
                    }
                    .perfil-text-wrapper {
                        flex-grow: 1;
                        min-width: 0;
                    }
                    .btn-gold {
                        background-color: #A4841C !important;
                        color: #ffffff !important;
                        border: 1px solid #A4841C !important;
                        transition: all 0.3s ease !important;
                        font-weight: bold;
                    }
                    .btn-gold:hover {
                        background-color: #8c7018 !important;
                        box-shadow: 0 0 10px rgba(164, 132, 28, 0.5);
                        transform: translateY(-1px);
                    }
                    .btn-outline-gold {
                        color: #A4841C !important;
                        background-color: transparent !important;
                        border: 1px solid #A4841C !important;
                        transition: all 0.3s ease !important;
                        font-weight: bold;
                    }
                    .btn-outline-gold:hover {
                        color: #000000 !important;
                        background-color: #A4841C !important;
                        box-shadow: 0 0 10px rgba(164, 132, 28, 0.3);
                    }
                    .avatar-container {
                        position: relative;
                        width: 150px;
                        height: 150px;
                        margin: 0 auto;
                    }
                    .avatar-img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                        border: 3px solid #A4841C;
                        box-shadow: 0 0 20px rgba(164, 132, 28, 0.3);
                        transition: all 0.3s ease;
                    }
                    .avatar-container:hover .avatar-img {
                        transform: scale(1.03);
                        box-shadow: 0 0 25px rgba(164, 132, 28, 0.5);
                    }
                    .perfil-welcome-banner {
                        background: linear-gradient(135deg, rgba(164, 132, 28, 0.15) 0%, rgba(20, 20, 20, 0.8) 100%);
                        border-left: 4px solid #A4841C;
                        border-radius: 8px;
                        padding: 15px 20px;
                    }
                `}
            </style>

            <Row className="g-4">
                {/* Columna Izquierda: Tarjeta de Identidad y Foto */}
                <Col lg={4}>
                    <Card className="perfil-card text-white text-center p-4">
                        <Card.Body>
                            <div className="avatar-container mb-3">
                                {perfil?.foto_cliente ? (
                                    <img
                                        src={perfil.foto_cliente}
                                        alt="Foto de Perfil"
                                        className="rounded-circle avatar-img"
                                    />
                                ) : (
                                    <div 
                                        className="rounded-circle avatar-img d-flex align-items-center justify-content-center bg-secondary"
                                        style={{ border: '3px solid #A4841C' }}
                                    >
                                        <i className="bi bi-person-fill text-white" style={{ fontSize: '70px' }}></i>
                                    </div>
                                )}
                            </div>
                            
                            <h4 className="fw-bold mb-1" style={{ color: '#A4841C' }}>
                                {perfil?.nombres} {perfil?.apellidos}
                            </h4>
                            <span className="badge rounded-pill bg-warning text-dark px-3 py-1.5 fw-bold text-uppercase mb-4" style={{ fontSize: '0.75rem', letterSpacing: '1px', backgroundColor: '#A4841C !important' }}>
                                Cliente Ouroboros
                            </span>

                            <hr className="border-secondary my-4" />

                            <div className="d-flex flex-column gap-2 justify-content-center">
                                {!editandoFoto ? (
                                    <>
                                        <Button
                                            variant="outline-warning"
                                            className="btn-outline-gold w-100 py-2"
                                            onClick={() => setEditandoFoto(true)}
                                            disabled={cargando}
                                        >
                                            <i className="bi bi-camera me-2"></i>
                                            {perfil?.foto_cliente ? 'Cambiar Foto de Perfil' : 'Agregar Foto de Perfil'}
                                        </Button>
                                        {perfil?.foto_cliente && (
                                            <Button
                                                variant="outline-danger"
                                                className="w-100 py-2"
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
                                            <Form.Control type="file" accept="image/*" onChange={manejoCambioArchivo} className="bg-dark text-white border-secondary" />
                                        </Form.Group>
                                        <div className="d-flex gap-2 w-100">
                                            <Button variant="warning" className="btn-gold flex-grow-1" onClick={subirFotoPerfil} disabled={cargando || !archivoFoto}>
                                                Guardar
                                            </Button>
                                            <Button variant="secondary" className="flex-grow-1" onClick={() => { setEditandoFoto(false); setArchivoFoto(null); }} disabled={cargando}>
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
                                <i className="bi bi-person-lines-fill text-warning" style={{ fontSize: '1.8rem', color: '#A4841C' }}></i>
                                <h3 className="fw-bold mb-0" style={{ color: '#A4841C' }}>Datos del Perfil</h3>
                            </div>

                            <div className="perfil-welcome-banner mb-4">
                                <h6 className="fw-bold mb-1" style={{ color: '#A4841C' }}>¡Bienvenido a tu Espacio Personal!</h6>
                                <p className="mb-0 small text-white">
                                    Aquí puedes revisar la información que nos proporcionaste al momento de crear tu cuenta. Si deseas agendar una cita o ver tu historial de atención, utiliza los accesos del menú principal.
                                </p>
                            </div>

                            <Row className="g-3">
                                {/* Nombres */}
                                <Col md={6}>
                                    <div className="perfil-info-block">
                                        <div className="perfil-icon-wrapper">
                                            <i className="bi bi-person"></i>
                                        </div>
                                        <div className="perfil-text-wrapper">
                                            <span className="text-white small text-uppercase d-block fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Nombres</span>
                                            <span className="h6 mb-0 text-white fw-semibold d-block text-truncate">{perfil?.nombres}</span>
                                        </div>
                                    </div>
                                </Col>

                                {/* Apellidos */}
                                <Col md={6}>
                                    <div className="perfil-info-block">
                                        <div className="perfil-icon-wrapper">
                                            <i className="bi bi-person-badge"></i>
                                        </div>
                                        <div className="perfil-text-wrapper">
                                            <span className="text-white small text-uppercase d-block fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Apellidos</span>
                                            <span className="h6 mb-0 text-white fw-semibold d-block text-truncate">{perfil?.apellidos}</span>
                                        </div>
                                    </div>
                                </Col>

                                {/* Cédula */}
                                <Col md={6}>
                                    <div className="perfil-info-block">
                                        <div className="perfil-icon-wrapper">
                                            <i className="bi bi-card-text"></i>
                                        </div>
                                        <div className="perfil-text-wrapper">
                                            <span className="text-white small text-uppercase d-block fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Cédula de Identidad</span>
                                            <span className="h6 mb-0 text-white fw-semibold d-block text-truncate">{perfil?.cedula}</span>
                                        </div>
                                    </div>
                                </Col>

                                {/* Teléfono */}
                                <Col md={6}>
                                    <div className="perfil-info-block">
                                        <div className="perfil-icon-wrapper">
                                            <i className="bi bi-telephone"></i>
                                        </div>
                                        <div className="perfil-text-wrapper">
                                            <span className="text-white small text-uppercase d-block fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Teléfono de Contacto</span>
                                            <span className="h6 mb-0 text-white fw-semibold d-block text-truncate">{perfil?.telefono || 'No registrado'}</span>
                                        </div>
                                    </div>
                                </Col>

                                {/* Dirección */}
                                <Col xs={12}>
                                    <div className="perfil-info-block">
                                        <div className="perfil-icon-wrapper">
                                            <i className="bi bi-geo-alt"></i>
                                        </div>
                                        <div className="perfil-text-wrapper">
                                            <span className="text-white small text-uppercase d-block fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Dirección de Domicilio</span>
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