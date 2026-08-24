import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ngcjpcdemuyxvgjqauzu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nY2pwY2RlbXV5eHZnanFhdXp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0OTM1MzIsImV4cCI6MjEwMzA2OTUzMn0.-L_P-ukZMEd3eImoP201mBqC_f9zerWUfHO6HVi8QBw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDiagnostics() {
  console.log("--- INIZIO DIAGNOSTICA SUPABASE ---");
  
  const testEmail = `test_${Date.now()}@gmail.com`;
  const testPassword = 'Password123!';

  console.log(`\n1. Tentativo di Registrazione con ${testEmail}...`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (signUpError) {
    console.error("ERRORE SIGNUP:", signUpError.message);
  } else {
    console.log("SIGNUP SUCCESSO!");
    console.log("Sessione restituita?", !!signUpData.session);
    console.log("Utente confermato?", signUpData.user?.email_confirmed_at ? "SI" : "NO");
  }

  console.log(`\n2. Tentativo di Login con ${testEmail}...`);
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signInError) {
    console.error("ERRORE LOGIN:", signInError.message);
  } else {
    console.log("LOGIN SUCCESSO! Sessione attiva.");
  }
  
  console.log("\n--- FINE DIAGNOSTICA ---");
}

runDiagnostics();
