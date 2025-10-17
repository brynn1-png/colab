const supabaseUrl = 'https://tqttpbhspgqwniwaokqh.supabase.co'; 
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxdHRwYmhzcGdxd25pd2Fva3FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MDM2MzksImV4cCI6MjA2NjA3OTYzOX0.q-R66Cb1qYx-0pCkKqy9bBE4BXJwcu4JN8Sv4XsgeiE'; // <-- Paste your Supabase Anon Key here
const supabase = supabase.createClient(supabaseUrl, supabaseKey)

document.getElementById('uploadBtn').addEventListener('click', async () => {
  const fileInput = document.getElementById('fileInput')
  const file = fileInput.files[0]
  if (!file) {
    alert('Please select a file to upload.')
    return
  }

  const { data, error } = await supabase
    .storage
    .from('music-cloud')
    .upload(`uploads/${file.name}`, file)

  if (error) {
    alert('Upload failed: ' + error.message)
  } else {
    alert('File uploaded successfully!')
  }
})