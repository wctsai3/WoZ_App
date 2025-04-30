'use client';

import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {Textarea} from '@/components/ui/textarea';
import {Button} from '@/components/ui/button';
import {useRouter} from 'next/navigation';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Calendar} from '@/components/ui/calendar';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {CalendarIcon} from 'lucide-react';
import {cn} from '@/lib/utils';
import {format} from 'date-fns';
import {useState} from 'react';
import {Checkbox} from '@/components/ui/checkbox';
import {Input} from '@/components/ui/input';
import {Slider} from '@/components/ui/slider';
import { useStateContext } from '@/lib/state-context'; // Adjust path if needed
import { toast } from '@/components/ui/use-toast'; // Adjust path if needed

const formSchema = z.object({
  projectType: z.string().min(1, {
    message: 'Please select a project type.',
  }),
  spaces: z.array(z.string()).optional(),
  otherSpace: z.string().optional(),
  squareFootage: z.string().optional(),
  budget: z.string().optional(),
  loveAboutSpace: z.string().optional(),
  dislikeAboutSpace: z.string().optional(),
  whoUsesSpace: z.string().optional(),
  functionalNeeds: z.string().optional(),
  designStyles: z.array(z.string()).optional(),
  otherStyle: z.string().optional(),
  idealSpace: z.string().optional(),
  colorPalette: z.string().optional(),
  colorsToAvoid: z.string().optional(),
  materialsTextures: z.string().optional(),
  itemsToKeep: z.string().optional(),
  furnitureToAdd: z.string().optional(),
  architecturalFeatures: z.string().optional(),
  otherDetails: z.string().optional(),
});

export default function IntakeQuestionnaire() {
  const router = useRouter();
  const [date, setDate] = useState<Date>();
  const { setSessionState } = useStateContext(); // Get function to update context state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectType: '',
      spaces: [],
      otherSpace: '',
      squareFootage: '',
      budget: '',
      loveAboutSpace: '',
      dislikeAboutSpace: '',
      whoUsesSpace: '',
      functionalNeeds: '',
      designStyles: [],
      otherStyle: '',
      idealSpace: '',
      colorPalette: '',
      colorsToAvoid: '',
      materialsTextures: '',
      itemsToKeep: '',
      furnitureToAdd: '',
      architecturalFeatures: '',
      otherDetails: '',
    },
  });


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    console.log('Form submitted:', values);

    try {
      // Create session with POST request including questionnaire data
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questionnaire: values }), // Send complete questionnaire data
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      // Get new session data (with ID) from response
      const newSessionData = await response.json();

      if (!newSessionData || !newSessionData.id) {
        throw new Error('API did not return a valid session object with ID.');
      }

      console.log('New session created:', newSessionData);

      // Update global state
      setSessionState(newSessionData);

      // Pass questionnaire data as URL parameters to ensure availability
      const queryParams = new URLSearchParams();
      queryParams.append('session', newSessionData.id);
      
      // Include important questionnaire data as URL parameters
      Object.entries(values).forEach(([key, value]) => {
        if (value && (typeof value === 'string' || Array.isArray(value))) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v));
          } else {
            queryParams.append(key, value);
          }
        }
      });

      // Redirect to moodboards page with all parameters
      router.push(`/moodboards?${queryParams.toString()}`);

      toast({
        title: 'Questionnaire Submitted!',
        description: 'Redirecting to your design recommendations...',
      });

    } catch (error) {
      console.error('Failed to submit questionnaire or create session:', error);
      toast({
        title: 'Submission Failed',
        description: 'Could not start your session. Please try again.',
        variant: 'destructive',
      });
      setIsSubmitting(false); // Re-enable button on error
    }
    // No need to setIsSubmitting(false) on success because we redirect
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-2/3 space-y-6"
      >
        <FormField
          control={form.control}
          name="projectType"
          render={({field}) => (
            <FormItem>
              <FormLabel>Project Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type"/>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="New construction">New construction</SelectItem>
                  <SelectItem value="Renovation">Renovation</SelectItem>
                  <SelectItem value="Room redesign">Room redesign</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="spaces"
          render={({field}) => (
            <FormItem>
              <FormLabel>Which space(s) need design help?</FormLabel>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="livingRoom"
                    checked={field.value?.includes('Living room')}
                    onCheckedChange={(checked) => {
                      field.onChange(
                        checked
                          ? [...(field.value || []), 'Living room']
                          : field.value?.filter((v) => v !== 'Living room')
                      );
                    }}
                  />
                  <label
                    htmlFor="livingRoom"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Living room
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="diningRoom"
                    checked={field.value?.includes('Dining room')}
                    onCheckedChange={(checked) => {
                      field.onChange(
                        checked
                          ? [...(field.value || []), 'Dining room']
                          : field.value?.filter((v) => v !== 'Dining room')
                      );
                    }}
                  />
                  <label
                    htmlFor="diningRoom"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Dining room
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="kitchen"
                    checked={field.value?.includes('Kitchen')}
                    onCheckedChange={(checked) => {
                      field.onChange(
                        checked
                          ? [...(field.value || []), 'Kitchen']
                          : field.value?.filter((v) => v !== 'Kitchen')
                      );
                    }}
                  />
                  <label
                    htmlFor="kitchen"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Kitchen
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bedroom"
                    checked={field.value?.includes('Bedroom')}
                    onCheckedChange={(checked) => {
                      field.onChange(
                        checked
                          ? [...(field.value || []), 'Bedroom']
                          : field.value?.filter((v) => v !== 'Bedroom')
                      );
                    }}
                  />
                  <label
                    htmlFor="bedroom"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Bedroom
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bathroom"
                    checked={field.value?.includes('Bathroom')}
                    onCheckedChange={(checked) => {
                      field.onChange(
                        checked
                          ? [...(field.value || []), 'Bathroom']
                          : field.value?.filter((v) => v !== 'Bathroom')
                      );
                    }}
                  />
                  <label
                    htmlFor="bathroom"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Bathroom
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="homeOffice"
                    checked={field.value?.includes('Home office')}
                    onCheckedChange={(checked) => {
                      field.onChange(
                        checked
                          ? [...(field.value || []), 'Home office']
                          : field.value?.filter((v) => v !== 'Home office')
                      );
                    }}
                  />
                  <label
                    htmlFor="homeOffice"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Home office
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    id="otherSpace"
                    placeholder="Other space"
                    {...field}
                  />
                </div>
              </div>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="squareFootage"
          render={({field}) => (
            <FormItem>
              <FormLabel>Approximate square footage</FormLabel>
              <FormControl>
                <Input placeholder="Enter square footage" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="budget"
          render={({field}) => (
            <FormItem>
              <FormLabel>Total budget</FormLabel>
              <FormControl>
                <Input placeholder="Enter total budget" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="loveAboutSpace"
          render={({field}) => (
            <FormItem>
              <FormLabel>What do you like about your current space?</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe what you like" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dislikeAboutSpace"
          render={({field}) => (
            <FormItem>
              <FormLabel>What do you dislike about your current space?</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe what you dislike" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="whoUsesSpace"
          render={({field}) => (
            <FormItem>
              <FormLabel>Who uses this space? (adults, children, pets)</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter who uses the space" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="functionalNeeds"
          render={({field}) => (
            <FormItem>
              <FormLabel>Specific functional needs (relaxing, studying, working, etc.)</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter functional needs" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="designStyles"
          render={({field}) => (
            <FormItem>
              <FormLabel>Preferred design style (select up to 3)</FormLabel>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="modern"
                    checked={field.value?.includes('Modern')}
                    onCheckedChange={(checked) => {
                      const newValue = checked
                        ? [...(field.value || []), 'Modern']
                        : field.value?.filter((v) => v !== 'Modern');
                      if (newValue.length <= 3) {
                        field.onChange(newValue);
                      }
                    }}
                  />
                  <label
                    htmlFor="modern"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Modern: Characterized by clean lines, minimalism, and a neutral color palette.
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="minimalist"
                    checked={field.value?.includes('Minimalist')}
                    onCheckedChange={(checked) => {
                      const newValue = checked
                        ? [...(field.value || []), 'Minimalist']
                        : field.value?.filter((v) => v !== 'Minimalist');
                      if (newValue.length <= 3) {
                        field.onChange(newValue);
                      }
                    }}
                  />
                  <label
                    htmlFor="minimalist"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Minimalist: Emphasizes simplicity, clean lines, and a monochromatic palette.
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="traditional"
                    checked={field.value?.includes('Traditional')}
                    onCheckedChange={(checked) => {
                      const newValue = checked
                        ? [...(field.value || []), 'Traditional']
                        : field.value?.filter((v) => v !== 'Traditional');
                      if (newValue.length <= 3) {
                        field.onChange(newValue);
                      }
                    }}
                  />
                  <label
                    htmlFor="traditional"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Traditional: Features rich colors, ornate details, and classic furniture arrangements.
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="midCentury"
                    checked={field.value?.includes('Mid-century')}
                    onCheckedChange={(checked) => {
                      const newValue = checked
                        ? [...(field.value || []), 'Mid-century']
                        : field.value?.filter((v) => v !== 'Mid-century');
                      if (newValue.length <= 3) {
                        field.onChange(newValue);
                      }
                    }}
                  />
                  <label
                    htmlFor="midCentury"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Mid-century: Combines clean lines, organic shapes, and a mix of materials like wood, metal, and vinyl.
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="industrial"
                    checked={field.value?.includes('Industrial')}
                    onCheckedChange={(checked) => {
                      const newValue = checked
                        ? [...(field.value || []), 'Industrial']
                        : field.value?.filter((v) => v !== 'Industrial');
                      if (newValue.length <= 3) {
                        field.onChange(newValue);
                      }
                    }}
                  />
                  <label
                    htmlFor="industrial"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Industrial: Celebrates raw and exposed materials like brick, concrete, and metal.
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bohemian"
                    checked={field.value?.includes('Bohemian')}
                    onCheckedChange={(checked) => {
                      const newValue = checked
                        ? [...(field.value || []), 'Bohemian']
                        : field.value?.filter((v) => v !== 'Bohemian');
                      if (newValue.length <= 3) {
                        field.onChange(newValue);
                      }
                    }}
                  />
                  <label
                    htmlFor="bohemian"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Bohemian: Features eclectic mixes of colors, patterns, and textures, often inspired by global cultures.
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="farmhouse"
                    checked={field.value?.includes('Farmhouse')}
                    onCheckedChange={(checked) => {
                      const newValue = checked
                        ? [...(field.value || []), 'Farmhouse']
                        : field.value?.filter((v) => v !== 'Farmhouse');
                      if (newValue.length <= 3) {
                        field.onChange(newValue);
                      }
                    }}
                  />
                  <label
                    htmlFor="farmhouse"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Farmhouse: Combines rustic elements with comfortable, practical designs.
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="scandinavian"
                    checked={field.value?.includes('Scandinavian')}
                    onCheckedChange={(checked) => {
                      const newValue = checked
                        ? [...(field.value || []), 'Scandinavian']
                        : field.value?.filter((v) => v !== 'Scandinavian');
                      if (newValue.length <= 3) {
                        field.onChange(newValue);
                      }
                    }}
                  />
                  <label
                    htmlFor="scandinavian"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Scandinavian: Focuses on simplicity, functionality, and natural light, often with a minimalist aesthetic.
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    id="otherStyle"
                    placeholder="Other style"
                    {...field}
                  />
                </div>
              </div>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="idealSpace"
          render={({field}) => (
            <FormItem>
              <FormLabel>Describe your ideal space in 3-5 words</FormLabel>
              <FormControl>
                <Input placeholder="Enter description" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="colorPalette"
          render={({field}) => (
            <FormItem>
              <FormLabel>Preferred color palette</FormLabel>
              <FormControl>
                <Input placeholder="Enter color palette" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="colorsToAvoid"
          render={({field}) => (
            <FormItem>
              <FormLabel>Colors to avoid</FormLabel>
              <FormControl>
                <Input placeholder="Enter colors to avoid" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="materialsTextures"
          render={({field}) => (
            <FormItem>
              <FormLabel>Preferred materials/textures</FormLabel>
              <FormControl>
                <Input placeholder="Enter materials/textures" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="itemsToKeep"
          render={({field}) => (
            <FormItem>
              <FormLabel>Items you plan to keep (furniture, art, etc.)</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter items to keep" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="furnitureToAdd"
          render={({field}) => (
            <FormItem>
              <FormLabel>Specific furniture pieces you want to add</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter furniture to add" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="architecturalFeatures"
          render={({field}) => (
            <FormItem>
              <FormLabel>Architectural features to work with or around</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter architectural features" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="otherDetails"
          render={({field}) => (
            <FormItem>
              <FormLabel>Any other details that would help inform your design suggestions</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter any other details" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
