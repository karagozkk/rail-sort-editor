import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const exportToUnity = async (allLevels, multipliers) => {
  const { gridMultiplier, cornerMultiplier } = multipliers;
  const zip = new JSZip();

  // Create unityleveldata directory inside zip
  const unityDir = zip.folder("unityleveldata");

  allLevels.forEach(level => {
    const levelNumber = level.id;
    const levelName = `Level_${levelNumber}`;
    const levelData = level.data;

    // Collect unique colors
    const colors = new Set();
    if (levelData.depots) {
      levelData.depots.forEach(depot => {
        if (depot.isLocked && depot.lockColor) colors.add(depot.lockColor);
        if (depot.cars) {
          Object.values(depot.cars).forEach(car => {
            if (car && car.color && car.color !== 'hidden') colors.add(car.color);
          });
        }
      });
    }

    const colorArray = Array.from(colors);
    const colorToWagonType = {};

    let availableTypes = [];
    const replenish = () => {
      availableTypes = [0, 1, 2, 3];
      availableTypes.sort(() => Math.random() - 0.5);
    };

    replenish();
    colorArray.forEach(color => {
      if (availableTypes.length === 0) replenish();
      colorToWagonType[color] = availableTypes.pop();
    });

    // Build YAML
    const lines = [];
    lines.push('%YAML 1.1');
    lines.push('%TAG !u! tag:unity3d.com,2011:');
    lines.push('--- !u!114 &11400000');
    lines.push('MonoBehaviour:');
    lines.push('  m_ObjectHideFlags: 0');
    lines.push('  m_CorrespondingSourceObject: {fileID: 0}');
    lines.push('  m_PrefabInstance: {fileID: 0}');
    lines.push('  m_PrefabAsset: {fileID: 0}');
    lines.push('  m_GameObject: {fileID: 0}');
    lines.push('  m_Enabled: 1');
    lines.push('  m_EditorHideFlags: 0');
    lines.push('  m_Script: {fileID: 11500000, guid: c06713979caccb64c8345aa318226361, type: 3}');
    lines.push(`  m_Name: ${levelName}`);
    lines.push(`  m_EditorClassIdentifier: Assembly-CSharp::LevelData`);
    lines.push(`  levelIndex: ${levelNumber}`);
    lines.push(`  levelNumber: ${levelNumber}`);
    lines.push(`  trainCapacity: ${levelData.trainCapacity || 8}`);
    lines.push(`  theme: ${levelData.theme || 0}`);
    lines.push(`  themeVar: 1`);
    lines.push(`  cameraOrthographicSize: 22.9`);
    lines.push(`  splineCorners:`);
    (levelData.spline?.nodes || []).forEach(node => {
      lines.push(`  - {x: ${node.x * gridMultiplier}, y: 0, z: ${node.z * gridMultiplier}}`);
    });
    lines.push(`  cornerRadius: ${(levelData.spline?.radius || 1) * cornerMultiplier}`);
    lines.push(`  isSplineClosed: ${levelData.spline?.isClosed ? 1 : 0}`);
    lines.push(`  depots:`);
    (levelData.depots || []).forEach((depot, i) => {
      lines.push(`  - depotId: Depot_${i + 1}`);

      // In the editor, depot.x and depot.z represent grid lines.
      // The true geometric center of the cells covered by the depot is offset by -0.5 for X and +0.5 for Z.
      const centerX = depot.x - 0.5;
      const centerZ = depot.z + 0.5;

      lines.push(`    position: {x: ${centerX * gridMultiplier}, y: 0, z: ${centerZ * gridMultiplier}}`);
      let rot = 0;
      if (depot.entryDirection === 'left') rot = 90;
      else if (depot.entryDirection === 'top') rot = 180;
      else if (depot.entryDirection === 'right') rot = -90;
      lines.push(`    rotation: {x: 0, y: ${rot}, z: 0}`);
      lines.push(`    isLocked: ${depot.isLocked ? 1 : 0}`);
      lines.push(`    keyColor: ${depot.lockColor || 0}`);
      lines.push(`    keyModel: ${(depot.isLocked && depot.lockColor) ? (colorToWagonType[depot.lockColor] || 0) : 0}`);
      lines.push(`    wagons:`);
      const cars = depot.cars || {};
      // Editor slots are 0-7. Unity slots are 0-7, but in reverse order (Editor 7 -> Unity 0).
      // Always output exactly 8 slots.
      for (let unitySlot = 0; unitySlot < 8; unitySlot++) {
        const editorSlot = 7 - unitySlot;
        const car = cars[`slot_${editorSlot}`];
        lines.push(`    - slotIndex: ${unitySlot}`);
        if (car && car.color) {
          const wColor = car.color === 'hidden' ? 0 : car.color;
          const wType = car.color === 'hidden' ? 0 : (colorToWagonType[car.color] || 0);
          lines.push(`      wagonColor: ${wColor}`);
          lines.push(`      wagonType: ${wType}`);
          lines.push(`      isHidden: ${car.isHidden ? 1 : 0}`);
        } else {
          lines.push(`      wagonColor: 0`);
          lines.push(`      wagonType: 0`);
          lines.push(`      isHidden: 0`);
        }
      }
    });

    const unityFilename = `${levelName}.asset`;
    unityDir.file(unityFilename, lines.join('\n') + '\n');
  });

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, 'unityleveldata.zip');
};
