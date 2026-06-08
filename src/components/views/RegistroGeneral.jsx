import { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, Form, Alert } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig.js';

const RegistroGeneral = () => {
    const [tipoRegistro, setTipoRegistro] = useState(null); // 'cliente' o 'mecanico'
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

    // Estado inicial basado en tu esquema DDL
    const [formData, setFormData] = useState({
        nombres: '',
        apellidos: '',
        cedula: '',
        telefono: '',
        direccion: '',
        email: '',
        password: ''
    });

    const obtenerRoleId = async (roleName) => {
      const { data, error } = await supabase
        .from('roles')
        .select('id')
        .eq('name', roleName)
        .single();

      if (error || !data) {
        throw new Error('No se pudo obtener el id del rol');
      }

      return data.id;
    };

    useEffect(() => {
        document.body.style.backgroundColor = '#121212';
        return () => { document.body.style.backgroundColor = ''; };
    }, []);

    const manejarCambio = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const manejarCambioCedula = (e) => {
        let valor = e.target.value.toUpperCase();
        // Eliminar guiones
        valor = valor.replace(/-/g, '');
        // Extraer números y letras por separado
        // Formato correcto: XXX-XXXXXX-XXXXC (3-6-4 dígitos + 1 letra)
        let numeros = valor.replace(/[^0-9]/g, '').substring(0, 13);
        let letra = valor.replace(/[^A-Z]/g, '').substring(0, 1);
        
        // Construir el formato correcto: XXX-XXXXXX-XXXXC
        let formateado = '';
        if (numeros.length > 0) {
            formateado = numeros.substring(0, 3);
        }
        if (numeros.length > 3) {
            formateado += '-' + numeros.substring(3, 9);
        }
        if (numeros.length > 9) {
            formateado += '-' + numeros.substring(9, 13);
        }
        if (letra) {
            formateado += letra;
        }

        setFormData({ ...formData, cedula: formateado });
    };

    const manejarCambioTelefono = (e) => {
        let valor = e.target.value;
        // Solo permitir números
        valor = valor.replace(/[^0-9]/g, '');
        // Máximo 8 números
        if (valor.length > 8) {
            valor = valor.substring(0, 8);
        }
        setFormData({ ...formData, telefono: valor });
    };

    const validarDatos = () => {
        // Validar teléfono: máximo 8 números
        if (formData.telefono && !/^\d{0,8}$/.test(formData.telefono)) {
            setMensaje({ tipo: 'danger', texto: 'Teléfono: máximo 8 números.' });
            return false;
        }

        // Validar cédula: formato XXX-XXXXXX-XXXXC (3-6-4 dígitos + 1 letra)
        if (formData.cedula && !/^\d{3}-\d{6}-\d{4}[A-Z]$/.test(formData.cedula)) {
            setMensaje({ tipo: 'danger', texto: 'Cédula debe tener formato: XXX-XXXXXX-XXXXC (ej: 001-121212-9990X).' });
            return false;
        }

        return true;
    };

    const guardarRegistro = async (e) => {
        e.preventDefault();
        setCargando(true);
        setMensaje({ tipo: '', texto: '' });

        if (!formData.email.trim() || !formData.password.trim()) {
            setMensaje({ tipo: 'danger', texto: 'Debe ingresar email y contraseña.' });
            setCargando(false);
            return;
        }

        // Validar datos específicos
        if (!validarDatos()) {
            setCargando(false);
            return;
        }

        try {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
            });

            if (signUpError) {
                throw signUpError;
            }

            if (!signUpData?.user?.id) {
                throw new Error('No se pudo crear el usuario de autenticación.');
            }

            const roleName = tipoRegistro === 'cliente' ? 'cliente' : 'mecanico';
            const roleId = await obtenerRoleId(roleName);

            const profileData = {
                id: signUpData.user.id,
                email: formData.email,
                nombre: `${formData.nombres} ${formData.apellidos}`.trim(),
                role_id: roleId
            };

            const { error: profileError } = await supabase.from('profiles').insert([profileData]);
            if (profileError) {
                throw profileError;
            }

            const tablaDestino = tipoRegistro === 'cliente' ? 'clientes' : 'mecanicos';
            const registroNegocio = {
                profile_id: signUpData.user.id,
                nombres: formData.nombres,
                apellidos: formData.apellidos,
                cedula: formData.cedula,
                telefono: formData.telefono,
                direccion: formData.direccion,
            };

            const { error: negocioError } = await supabase
                .from(tablaDestino)
                .insert([registroNegocio]);

            if (negocioError) {
                throw negocioError;
            }

            setMensaje({ 
                tipo: 'success', 
                texto: `${tipoRegistro === 'cliente' ? 'Cliente' : 'Mecánico'} registrado correctamente.` 
            });

            setFormData({ nombres: '', apellidos: '', cedula: '', telefono: '', direccion: '', email: '', password: '' });
            setTimeout(() => setTipoRegistro(null), 2000);

        } catch (error) {
            setMensaje({ tipo: 'danger', texto: error.message || 'Error al registrar usuario.' });
        } finally {
            setCargando(false);
        }
    };

    return (
        <Container className="py-5 page-dark">
            <div className="text-center mb-5">
                <h2 className="fw-bold titulo-primary">Registro General</h2>
                <p className="text-white">Seleccione el tipo de perfil que desea dar de alta en el sistema.</p>
            </div>

            {/* Alerta de mensajes */}
            {mensaje.texto && (
                <Row className="justify-content-center mb-4">
                    <Col md={8} lg={6}>
                        <Alert variant={mensaje.tipo} onClose={() => setMensaje({ tipo: '', texto: '' })} dismissible>
                            {mensaje.texto}
                        </Alert>
                    </Col>
                </Row>
            )}

            {/* Paso 1: Selección de Tipo */}
            {!tipoRegistro && (
                <Row className="justify-content-center gap-4">
                    <Col md={4}>
                        <Card 
                            className="h-100 shadow-sm border-0 text-center p-4 text-white card-dark"
                            onClick={() => setTipoRegistro('cliente')}
                            style={{ cursor: 'pointer' }} 
                        >
                            <Card.Body>
                                <i className="bi bi-person-badge display-3 titulo-primary"></i>
                                <h4 className="mt-3 fw-bold">Cliente</h4>
                                <p className="text-white-50 small">Registrar nuevo dueño de vehículo para historial y citas.</p>
                                <Button variant="outline-warning" className="mt-2 btn-outline-gold">
                                    Seleccionar
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card 
                            className="h-100 shadow-sm border-0 text-center p-4 text-white card-dark"
                            onClick={() => setTipoRegistro('mecanico')}
                            style={{ cursor: 'pointer' }}
                        >
                            <Card.Body>
                                <i className="bi bi-wrench-adjustable display-3 titulo-primary"></i>
                                <h4 className="mt-3 fw-bold">Mecánico</h4>
                                <p className="text-white-50 small">Dar de alta a un técnico para asignación de reparaciones.</p>
                                <Button variant="outline-warning" className="mt-2 btn-outline-gold">
                                    Seleccionar
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Paso 2: Formulario Dinámico */}
            {tipoRegistro && (
                <Row className="justify-content-center">
                    <Col md={8} lg={6}>
                        <Card className="shadow border-0 text-white card-dark">
                            <Card.Header className="border-0 pt-4 px-4 d-flex justify-content-between align-items-center card-dark">
                                <h4 className="fw-bold mb-0 titulo-primary">
                                    Nuevo {tipoRegistro === 'cliente' ? 'Cliente' : 'Mecánico'}
                                </h4>
                                <Button variant="link" className="text-white-50 p-0" onClick={() => setTipoRegistro(null)}>
                                    <i className="bi bi-x-lg"></i> Cancelar
                                </Button>
                            </Card.Header>
                            <Card.Body className="p-4">
                                <Form onSubmit={guardarRegistro}>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="small fw-bold">Nombres</Form.Label>
                                                <Form.Control name="nombres" value={formData.nombres} onChange={manejarCambio} className="input-premium" required />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="small fw-bold">Apellidos</Form.Label>
                                                <Form.Control name="apellidos" value={formData.apellidos} onChange={manejarCambio} className="input-premium" required />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Form.Group className="mb-3">
                                        <Form.Label className="small fw-bold">Cédula de Identidad</Form.Label>
                                        <Form.Control name="cedula" value={formData.cedula} placeholder="XXX-XXXXXX-XXXXC" onChange={manejarCambioCedula} className="input-premium" required />
                                        <Form.Text className="text-muted-custom small">Ej: 001-121212-9990X</Form.Text>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label className="small fw-bold">Teléfono</Form.Label>
                                        <Form.Control name="telefono" value={formData.telefono} onChange={manejarCambioTelefono} className="input-premium" placeholder="Máx. 8 números" maxLength="8" />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label className="small fw-bold">Dirección</Form.Label>
                                        <Form.Control as="textarea" rows={2} name="direccion" value={formData.direccion} onChange={manejarCambio} className="input-premium" />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label className="small fw-bold">Correo electrónico</Form.Label>
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={manejarCambio}
                                            className="bg-secondary text-white border-0"
                                            required
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label className="small fw-bold">Contraseña</Form.Label>
                                        <Form.Control
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={manejarCambio}
                                            className="input-premium"
                                            required
                                        />
                                    </Form.Group>

                                    <Button 
                                        type="submit" 
                                        className="w-100 py-2 shadow-sm btn-primary-custom"
                                        disabled={cargando}
                                    >
                                        {cargando ? 'Guardando...' : `Registrar ${tipoRegistro}`}
                                    </Button>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}
        </Container>
    );
};

export default RegistroGeneral;