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
    const rolGuardado = localStorage.getItem("rol-supabase")?.toLowerCase();

    if (usuarioGuardado) {
      if (rolGuardado === 'admin') navegar("/inicio-admin");
      else if (rolGuardado === 'mecanico') navegar("/repuestos");
      else if (rolGuardado === 'cliente') navegar("/perfil-cliente");
      else navegar("/");
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
        if (rol === 'admin') navegar("/inicio-admin");
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
    <div className="main-page-container d-flex align-items-center justify-content-center">
      <div className="login-card-animated p-4">
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
    </div>
  );
};

export default Login;
