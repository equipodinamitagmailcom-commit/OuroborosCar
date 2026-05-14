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

    const cargarDatosPerfil = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('clientes')
                .select('*, url_foto_perfil') // Asegúrate de seleccionar el campo de la foto
                .eq('profile_id', user.id)
                .single();

            if (error) throw error;
            setPerfil(data);
        } catch (err) {
            console.error("Error al cargar perfil:", err.message);
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
                .from('fotos_perfil_clientes') // Nombre del bucket en Supabase Storage
                .upload(nombreArchivo, archivoFoto);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('fotos_perfil_clientes')
                .getPublicUrl(nombreArchivo);
            const nuevaUrl = urlData.publicUrl;

            // Eliminar foto antigua si existe
            if (perfil?.url_foto_perfil) {
                const oldFileName = perfil.url_foto_perfil.split('/').pop().split('?')[0];
                await supabase.storage.from('fotos_perfil_clientes').remove([oldFileName]);
            }

            const { error: updateError } = await supabase
                .from('clientes')
                .update({ url_foto_perfil: nuevaUrl })
                .eq('profile_id', user.id);

            if (updateError) throw updateError;

            setPerfil(prev => ({ ...prev, url_foto_perfil: nuevaUrl }));
            setArchivoFoto(null);
            setEditandoFoto(false);
            setToast({ mostrar: true, mensaje: "Foto de perfil actualizada exitosamente.", tipo: "exito" });

        } catch (err) {
            console.error("Error al subir foto de perfil:", err.message);
            setToast({ mostrar: true, mensaje: `Error al actualizar la foto: ${err.message}`, tipo: "error" });
        } finally {
            setCargando(false);
        }
    };

    const eliminarFotoPerfil = async () => {
        if (!perfil?.url_foto_perfil) return;

        setCargando(true);
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error("Usuario no autenticado.");

            const oldFileName = perfil.url_foto_perfil.split('/').pop().split('?')[0];
            const { error: removeError } = await supabase.storage.from('fotos_perfil_clientes').remove([oldFileName]);
            if (removeError) throw removeError;

            const { error: updateError } = await supabase
                .from('clientes')
                .update({ url_foto_perfil: null })
                .eq('profile_id', user.id);

            if (updateError) throw updateError;

            setPerfil(prev => ({ ...prev, url_foto_perfil: null }));
            setToast({ mostrar: true, mensaje: "Foto de perfil eliminada exitosamente.", tipo: "exito" });

        } catch (err) {
            console.error("Error al eliminar foto de perfil:", err.message);
            setToast({ mostrar: true, mensaje: `Error al eliminar la foto: ${err.message}`, tipo: "error" });
        } finally {
            setCargando(false);
        }
    };

    if (cargando) return <Container className="text-center py-5"><Spinner animation="border" variant="warning" /></Container>;

    return (
        <Container className="py-5 mt-5" style={{ minHeight: '100vh' }}>
            <Row className="justify-content-center">
                <Col md={8}>
                    <Card className="bg-dark text-white border-0 shadow-lg">
                        <Card.Body className="p-5">
                            <div className="text-center mb-4">
                                <div className="mb-3">
                                    {perfil?.url_foto_perfil ? (
                                        <img
                                            src={perfil.url_foto_perfil}
                                            alt="Foto de Perfil"
                                            className="rounded-circle border border-warning"
                                            style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <i className="bi bi-person-circle display-1 text-warning"></i>
                                    )}
                                </div>
                                <h2 className="fw-bold" style={{ color: '#A4841C' }}>Mi Perfil de Cliente</h2>
                                <p className="text-muted">Bienvenido a Ouroboros Car</p>
                            </div>
                            <hr className="border-secondary" />
                            <Row className="g-4">
                                <Col md={6}>
                                    <label className="text-muted small text-uppercase fw-bold">Nombres</label>
                                    <p className="h5">{perfil?.nombres}</p>
                                </Col>
                                <Col md={6}>
                                    <label className="text-muted small text-uppercase fw-bold">Apellidos</label>
                                    <p className="h5">{perfil?.apellidos}</p>
                                </Col>
                                <Col md={6}>
                                    <label className="text-muted small text-uppercase fw-bold">Cédula</label>
                                    <p className="h5">{perfil?.cedula}</p>
                                </Col>
                                <Col md={6}>
                                    <label className="text-muted small text-uppercase fw-bold">Teléfono</label>
                                    <p className="h5">{perfil?.telefono || 'No registrado'}</p>
                                </Col>
                                <Col xs={12}>
                                    <label className="text-muted small text-uppercase fw-bold">Dirección</label>
                                    <p className="h5">{perfil?.direccion || 'No registrada'}</p>
                                </Col>
                            </Row>
                            <hr className="border-secondary mt-4" />
                            <div className="text-center mt-4">
                                {!editandoFoto ? (
                                    <>
                                        <Button
                                            variant="outline-warning"
                                            className="me-2"
                                            onClick={() => setEditandoFoto(true)}
                                            disabled={cargando}
                                        >
                                            <i className="bi bi-camera me-2"></i>
                                            {perfil?.url_foto_perfil ? 'Cambiar Foto' : 'Agregar Foto'}
                                        </Button>
                                        {perfil?.url_foto_perfil && (
                                            <Button
                                                variant="outline-danger"
                                                onClick={eliminarFotoPerfil}
                                                disabled={cargando}
                                            >
                                                <i className="bi bi-trash me-2"></i>
                                                Eliminar Foto
                                            </Button>
                                        )}
                                    </>
                                ) : (
                                    <div className="d-flex flex-column align-items-center">
                                        <Form.Group controlId="formFile" className="mb-3 w-75">
                                            <Form.Label className="text-muted small">Selecciona una nueva foto de perfil</Form.Label>
                                            <Form.Control type="file" accept="image/*" onChange={manejoCambioArchivo} />
                                        </Form.Group>
                                        <div className="d-flex gap-2">
                                            <Button variant="warning" onClick={subirFotoPerfil} disabled={cargando || !archivoFoto}>Guardar Foto</Button>
                                            <Button variant="secondary" onClick={() => { setEditandoFoto(false); setArchivoFoto(null); }} disabled={cargando}>Cancelar</Button>
                                        </div>
                                    </div>
                                )}
                            </div>
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
    );
};

export default VistaCliente;