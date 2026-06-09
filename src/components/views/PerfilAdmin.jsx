import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Spinner } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig.js';

const PerfilAdmin = () => {
    const [perfil, setPerfil] = useState(null);
    const [rolNombre, setRolNombre] = useState('');
    const [cargando, setCargando] = useState(true);

    const cargarDatosAdmin = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Consultar datos en la tabla de perfiles generales
            const { data: profile, error: pError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (pError) throw pError;

            // Consultar el nombre del rol para mostrarlo elegantemente
            const { data: role, error: rError } = await supabase
                .from('roles')
                .select('name')
                .eq('id', profile.role_id)
                .single();

            if (rError) throw rError;

            setPerfil(profile);
            setRolNombre(role.name);
        } catch (err) {
            console.error("Error al cargar perfil administrativo:", err.message);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatosAdmin();
    }, []);

    if (cargando) return <Container className="text-center py-5"><Spinner animation="border" className="text-gold" /></Container>;

    return (
        <div className="bg-radial-premium">
            <Container className="py-5">
                <Row className="justify-content-center">
                    <Col lg={6}>
                        <Card className="perfil-card text-white p-4 shadow-lg border-0">
                            <Card.Body className="text-center">
                                <div className="avatar-container mb-4">
                                    <div className="avatar-img d-flex align-items-center justify-content-center bg-dark mx-auto border-gold">
                                        <i className="bi bi-shield-lock-fill text-gold" style={{ fontSize: '70px' }}></i>
                                    </div>
                                </div>
                                <h2 className="fw-bold text-gold mb-1">Perfil Administrativo</h2>
                                <span className="badge rounded-pill bg-warning text-dark px-3 py-2 fw-bold text-uppercase mb-4 shadow-sm">
                                    Acceso Nivel: {rolNombre || 'Administrador'}
                                </span>

                                <hr className="border-secondary opacity-25 my-4" />

                                <div className="text-start">
                                    <div className="perfil-info-block mb-3 d-flex align-items-center gap-3">
                                        <div className="perfil-icon-wrapper">
                                            <i className="bi bi-envelope-at-fill"></i>
                                        </div>
                                        <div>
                                            <span className="text-white-50 small text-uppercase d-block fw-bold" style={{fontSize: '0.7rem'}}>Correo Electrónico</span>
                                            <span className="h6 mb-0 text-white fw-semibold">{perfil?.email}</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="mt-4 text-white-50 small italic">
                                    Como administrador, tu cuenta está protegida por políticas de seguridad de alto nivel.
                                </p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default PerfilAdmin;