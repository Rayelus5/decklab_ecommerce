import { auth } from "@/lib/auth"

export default auth((req) => {
    // Aquí podemos proteger rutas en el futuro
    // Ej: si intenta entrar a /admin y no es admin...
})

export const config = {
    // Matcher para excluir rutas estáticas y de api interna
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}