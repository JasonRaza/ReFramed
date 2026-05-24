// Déclaration des imports CSS (side-effect et modules)
declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}
