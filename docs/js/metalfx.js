import {
    ShaderMount,
    liquidMetalFragmentShader
} from "https://esm.sh/@paper-design/shaders@0.0.81?bundle";

const buttons = document.querySelectorAll(".join-btn, .mobile-menu-cta, .hero-join-cta");

buttons.forEach((button) => {
    if (button.dataset.metalMounted === "true") return;

    button.dataset.metalMounted = "true";
    const wrapper = document.createElement("span");
    wrapper.className = "metal-fx-root metal-fx-static";
    wrapper.dataset.paperShader = "";
    const buttonStyle = getComputedStyle(button);
    wrapper.style.borderRadius = buttonStyle.borderTopLeftRadius;
    wrapper.style.setProperty("--mfx-radius", buttonStyle.borderTopLeftRadius);
    button.parentNode.insertBefore(wrapper, button);
    wrapper.appendChild(button);
    button.classList.add("metal-fx-button");

    try {
        wrapper.paperShaderMount = new ShaderMount(wrapper, liquidMetalFragmentShader, {
            shape:  "none",
            colorBack: "rgba(12, 28, 38, 0.98)",
            colorTint: "rgba(102, 214, 255, 0.95)",
            repetition: 2.2,
            shiftRed: 0.75,
            shiftBlue: 0.75,
            contour: 0.72,
            softness: 0.1,
            distortion: 0.24,
            angle: 35
        }, { alpha: true }, 0.55, 0, 1, 120000);
    } catch (error) {
        button.dataset.metalMounted = "false";
        wrapper.replaceWith(button);
        console.warn("Metal button effect unavailable:", error);
    }
});
