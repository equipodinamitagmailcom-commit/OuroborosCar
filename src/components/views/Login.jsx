import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FormularioLogin from "../login/FormularioLogin.jsx";
import { supabase } from "../database/supabaseconfig.js";

const obtenerNombreRol = async (roleId) => {
  console.log("🔄 Convirtiendo roleId", roleId, "a nombre...");
  
  const { data, error } = await supabase
    .from("roles")
    .select("id, name")
    .eq("id", roleId);

  console.log("📋 Datos de roles:", { data, error });

  if (error) {
    console.error("❌ Error consultando roles:", error);
    return null;
  }

  if (!data || data.length === 0) {
    console.error("❌ No se encontró rol con id:", roleId);
    console.log("⚠️ Verifica que la tabla 'roles' tenga datos para id =", roleId);
    return null;
  }

  const roleName = data[0].name?.toLowerCase();
  console.log("✅ Rol encontrado:", roleName);
  return roleName;
};

// Los roles se leen 100% de la base de datos, sin hardcoding

const obtenerRolUsuario = async (userId) => {
  console.log("🔍 Buscando perfil para userId:", userId);
  
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role_id, email")
    .eq("id", userId);

  console.log("📋 Resultado de consulta:", { data, error });

  if (error) {
    console.error("❌ Error obteniendo perfil:", error);
    return null;
  }

  if (!data || data.length === 0) {
    console.warn("⚠️ No existe perfil para el usuario:", userId);
    return null;
  }

  const profileData = data[0];
  console.log("✅ Perfil encontrado:", profileData);
  
  return await obtenerNombreRol(profileData.role_id);
};

const Login = () => {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [verContrasena, setVerContrasena] = useState(false);
  const [error, setError] = useState(null);
  const navegar = useNavigate();

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("usuario-supabase");
    if (usuarioGuardado) {
      navegar("/");
    }
  }, [navegar]);

  const iniciarSesion = async () => {
    if (!usuario.trim() || !contrasena.trim()) {
      setError("Debes ingresar email y contraseña.");
      return;
    }

    try {
      console.log("🔐 Intentando autenticar con:", usuario);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: usuario,
        password: contrasena,
      });

      if (error) {
        console.error("❌ Error de autenticación:", error);
        setError(error.message || "Usuario o contraseña incorrectos");
        return;
      }

      console.log("✅ Autenticación exitosa. UID:", data.user.id);

      if (data.user) {
        let rol = await obtenerRolUsuario(data.user.id);

        if (!rol) {
          console.error("❌ No se encontró rol para el usuario");
          setError("Tu perfil de usuario no existe. Contacta al administrador.");
          return;
        }

        console.log("🎯 Rol asignado:", rol);

        rol = rol?.toLowerCase();
        localStorage.setItem("usuario-supabase", usuario);
        localStorage.setItem("rol-supabase", rol);
        console.log("💾 Datos guardados en localStorage");
        
        // Redirección por Rol
        if (rol === 'admin') navegar("/vehiculos");
        else if (rol === 'mecanico') navegar("/repuestos");
        else if (rol === 'cliente') navegar("/perfil-cliente");
        else navegar("/");

      }
    } catch (err) {
      console.error("❌ Error en la solicitud:", err);
      setError(err.message || "Error al conectar con el servidor");
    }
  };

  return (
    <div className="estilo-contenedor-login py-5">
      <style>
        {`
          .estilo-contenedor-login {
            background-color: #1e1e1e !important; /* Fondo general de la página, negro menos oscuro */
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          /* Estilo para el cuadro (Card/Formulario) */
          .estilo-contenedor-login .card, 
          .estilo-contenedor-login form {
            background: linear-gradient(to bottom, #A4841C 0%, #121212 70%) !important; /* Degradado dorado a negro para el cuadro */
            background-size: 100% 200% !important; /* Hacemos el fondo más alto para poder moverlo */
            animation: moverDegradado 8s ease infinite; /* Aplicamos la animación de movimiento */
            color: #ffffff !important;
            padding: 2.5rem;
            border-radius: 15px;
            border: 2px solid #000;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          }
          /* Definición de la animación para el movimiento suave */
          @keyframes moverDegradado {
            0% { background-position: 0% 0%; }
            50% { background-position: 0% 100%; }
            100% { background-position: 0% 0%; }
          }
          .estilo-contenedor-login h2, 
          .estilo-contenedor-login label {
            color: white !important;
          }
          .estilo-contenedor-login .form-control {
            background-color: #2b2b2b !important;
            color: white !important;
            border: 1px solid #A4841C !important;
          }
          .estilo-contenedor-login .input-group .form-control {
            border-right: none !important;
          }
          .estilo-contenedor-login .btn-outline-secondary {
            background-color: #2b2b2b !important;
            color: #A4841C !important;
            border: 1px solid #A4841C !important;
            border-left: none !important;
          }
          .estilo-contenedor-login .btn-primary {
            background-color: #A4841C !important;
            border: 1px solid #A4841C !important;
            transition: all 0.3s ease-in-out !important;
            box-shadow: 0 0 0 rgba(164, 132, 28, 0);
          }
          .estilo-contenedor-login .btn-primary:hover {
            background-color: #8c7018 !important;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(164, 132, 28, 0.4);
            border-color: #ffffff !important;
          }
          /* Animación para que el cambio de ícono sea fluido */
          @keyframes eyePop {
            from { transform: scale(0.5) rotate(-10deg); opacity: 0; }
            to { transform: scale(1) rotate(0deg); opacity: 1; }
          }
          .estilo-contenedor-login .input-group .btn i {
            display: inline-block;
            animation: eyePop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }
          .estilo-contenedor-login .input-group .btn:active i {
            transform: scale(0.8);
            transition: transform 0.1s;
          }
        `}
      </style>
      <FormularioLogin
        usuario={usuario}
        contrasena={contrasena}
        error={error}
        setUsuario={setUsuario}
        setContrasena={setContrasena}
        iniciarSesion={iniciarSesion}
        verContrasena={verContrasena}
        setVerContrasena={setVerContrasena}
      />
    </div>
  );
};

export default Login;
