import { useState } from 'react';                                   // added
import ParallaxScene from './components/ParallaxScene/ParallaxScene';
import MainMenu from './components/MainMenu/MainMenu';
import IntroScreen from './components/IntroScreen/IntroScreen';    // added
import { menuItems } from './data/menuItems';

export default function App() {
  const [introDone, setIntroDone] = useState(false);               // added

  const handleSelect = (id) => {
    console.log('Selected:', id);
  };

  return (
    <>
      <ParallaxScene image="/resources/theresa1.jpg">
        <MainMenu items={menuItems} onSelect={handleSelect} />
      </ParallaxScene>

      {!introDone && <IntroScreen onDone={() => setIntroDone(true)} />}  {/* added */}
    </>
  );
}