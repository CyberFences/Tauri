fn main() {
    // Tell cargo to link against wpcap.lib from Npcap
    println!("cargo:rustc-link-lib=wpcap");
    
    // Add the Npcap library path
    let npcap_path = r"C:\Program Files\Npcap\npcap-sdk-1.15\Lib\x64";
    println!("cargo:rustc-link-search=native={}", npcap_path);
    
    // Tell cargo to re-run this build script if the Npcap path changes
    println!("cargo:rerun-if-changed={}", npcap_path);
    
    tauri_build::build()
}