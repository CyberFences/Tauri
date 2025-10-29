mod crypto;
mod packet_capture;
mod blockchain;
mod meta_transaction;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            // Crypto commands
            crypto::generate_wallet,
            crypto::restore_wallet,
            crypto::sign_payload,
            crypto::encrypt_data,
            crypto::decrypt_data,
            crypto::encrypt_wallet_data,
            crypto::decrypt_wallet_data,
            // Blockchain commands
            blockchain::register_machine_on_blockchain,
            blockchain::register_machine_gasless,
            blockchain::check_machine_registration,
            blockchain::get_machine_id_by_public_key,
            blockchain::get_total_registered_machines,
            // Meta-transaction commands
            meta_transaction::execute_meta_transaction,
            meta_transaction::get_user_nonce,
            meta_transaction::sign_message,
            // Packet capture commands
                packet_capture::start_packet_capture,
                packet_capture::stop_packet_capture,
                packet_capture::is_capture_active,
                packet_capture::get_network_stats,
                packet_capture::reset_packet_capture,
                packet_capture::check_admin_privileges,
                packet_capture::export_cic_csv
        ])
        .setup(|app| {
            // Store app handle for packet capture events
            packet_capture::set_app_handle(app.handle().clone());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
