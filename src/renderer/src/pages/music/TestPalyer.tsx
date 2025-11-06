import Artplayer from './components/Artplayer'

function App() {
    return (
        <div>
            <Artplayer
                option={{
                    url: 'path/to/video.mp4',
                }}
                style={{
                    width: '600px',
                    height: '400px',
                    margin: '60px auto 0',
                }}
                getInstance={art => console.log(art)}
            />
        </div>
    )
}

export default App